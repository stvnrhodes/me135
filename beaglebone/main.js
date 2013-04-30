// Set up logging first
var log = require('winston');
var fs = require('fs');
fs.unlink('public/log.log', function() {
  log.add(log.transports.File, { filename:'public/log.log', timestamp:true });
});
log.info("Starting program");

var express = require('express');
var http = require('http');
var url = require('url');
var WebSocketServer = require('ws').Server;
var serialport = require('serialport');
var Uart = serialport.SerialPort;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var async = require('async');
var net = require('net');

// Shared code with browser
var Maze = require('./public/maze.verbose.js').Maze;
var Cell = require('./public/maze.verbose.js').Cell;

var CarState = require('./car_state.js').CarState;

// Create the socket for the OpenCV IPC, and return it in the callback
function makeSocket(callback) {
  var socket = net.createServer(function(connection) { //'connection' listener
    log.info('webcam connected');
    connection.on('end', function() {
      log.info('webcam disconnected');
    });
    callback(null, connection);
  });
  socket.listen('/tmp/opencv.sock', function() { //'listening' listener
    log.info('server bound');
  });
  process.on( 'SIGINT', function() { socket.close(); });
  process.on( 'uncaughtException', function() { socket.close(); });
}

// Create the uart, and return it in the callback
function makeUart(callback) {
  var uart = new Uart('/dev/ttyO4', {
    baudrate: 115200,
    parser: serialport.parsers.readline("\n")
  });
  uart.once("open", function () {
    log.info('UART Open');
    callback(null, uart)
  });
}

// Make the uart and the socket in parallel
async.parallel({
    socket: makeSocket,
    uart: makeUart },
  function(err, r) {
    if (err) {
      log.error(err);
      vision.kill();
      process.exit();
    }
    runServer(r.socket, r.uart);
});

// Starts mjpg_streamer, taking in from camera and outputting to
// a web server and OpenCV
var cmd = 'mjpg-streamer/mjpg_streamer';
// Resolution is lower so we can process faster
var args = ['-i','mjpg-streamer/input_uvc.so -r 320x240',
            '-o','mjpg-streamer/output_http.so -p 8081',
            '-o','mjpg-streamer/output_opencv.so']
// For global access
var vision;
function monitorProcess(spawned) {
  vision = spawned;
  spawned.stdout.on('data', function (data) {
    log.info('stdout: ' + data);
  });
  spawned.stderr.on('data', function (data) {
    log.warn('stderr: ' + data);
  });
  spawned.on('close', function (code) {
    log.info('child process exited with code ' + code);
    // log.info('attemting to restart child');
    // monitorProcess(spawn(cmd, args));
  });
}
monitorProcess(spawn(cmd, args));

// Cleanup code for when killed with C-c
process.on( 'SIGINT', function() {
  log.warn("Kill signal recieved");
  vision.kill();
  process.exit();
});

// Cleanup code for exceptions
process.on('uncaughtException', function(err) {
  log.error(err.stack);
  vision.kill();
  process.exit();
});

// create main server and websocket server
function runServer (socket, uart) {
  log.info("Starting Server");
  var app = express();
  app.use(express.static(__dirname + '/public'));

  var server = http.createServer(app);
  server.listen(8080);

  var car_state = new CarState();

  pure_uart_handler(uart, car_state);
  pure_socket_handler(socket);
  uart_socket_handler(uart, socket);

  var wss = new WebSocketServer({server: server});
  wss.on('connection', function (ws) {
    log.info("Running websockets");
    pure_ws_handler(ws, car_state);
    ws_socket_handler(ws, socket);
    ws_uart_handler(ws, uart, car_state);
  });

}

function pure_ws_handler(ws, state) {
  // Send state on initial connection
  var msg;
  msg = { id:'state', state: state.mode };
  ws.send(JSON.stringify(msg));
  msg = state.color_state;
  ws.send(JSON.stringify(msg));
  msg = { id:'shoot', num: state.num_shots };
  ws.send(JSON.stringify(msg));
  msg = { id:'claw_pos', claw: state.claw_pos };
  ws.send(JSON.stringify(msg));
  msg = { id:'maze', maze: state.maze.getData(), cell: state.cell.getData() };
  ws.send(JSON.stringify(msg));
  ws.on('message', function(data, flags) {
    if (!flags.binary) {
      var msg = JSON.parse(data);
      if (msg.id === 'state') {
        state.mode = msg.state;
      }
    }
  });
}

function pure_uart_handler(uart, state) {
  // Set initial claw position
  uart.write('c' + (state.claw_pos < 10 ? '0' : '') + state.claw_pos);
  // Get initial walls
  uart.write('w');


  uart.on('data', function (data) {
    // Data from uart is in JSON
    log.verbose("UART data received: " + data);
    var parsed = {}
    try {
      parsed = JSON.parse(data);
    } catch(e) {
      log.warn("UART is not JSON: " + e)
    }
    if (parsed.id === 'maze_walls') {
      log.info(JSON.stringify(parsed));
      if (parsed.action === 'fwd') {
        cell.move(1);
      } else if (parsed.action === 'left') {
        cell.turn('l');
      } else if (parsed.action === 'right') {
        cell.turn('r');
      }
      if (parsed.left) { state.cell.addWall('L'); }
      else { state.cell.addConnect('L'); }
      if (parsed.center) { state.cell.addWall('F'); }
      else { state.cell.addConnect('F'); }
      if (parsed.right) { state.cell.addWall('R'); }
      else { state.cell.addConnect('R'); }
      var msg = {id:'maze', maze:state.maze.getData(),
                            cell:state.cell.getData()};
      data = JSON.stringify(msg);
    }
  });

}

function pure_socket_handler(socket) {

}

function ws_socket_handler(ws, socket) {
  ws.on('message', function(data, flags) {
    if (!flags.binary) {
      log.verbose("Websocket message:" + data);
      var msg = JSON.parse(data);
      if (msg.id == 'pic_xy') {
        try {
          socket.write(data);
        } catch(e) {
          log.error("Socket fail: " + e);
        }
      }
    }
  });

  function sendCvData(data) {
    log.verbose('OpenCV data received: ' + data);
    var msg = {};
    try {
      msg = JSON.parse(data);
    } catch(e) {
      log.warn("Socket: " + e);
    }
    if (msg.id === 'moments' || msg.id === 'color') {
      ws.send(data, function(error) {
        if (error) {
          log.warn('ws: ' + error);
          socket.removeListener('data', sendCvData);
        }
      });
    }
  }
  socket.on('data', sendCvData);
}

function uart_socket_handler(uart, socket) {

}

function ws_uart_handler(ws, uart, state) {
  ws.on('message', function(data, flags) {
    if (!flags.binary) {
      log.verbose("Websocket message:" + data);
      var msg = JSON.parse(data);
      if (msg.id === 'led') {
        log.info("Toggling LED " + msg.num);
        uart.write('l' + msg.num +'\n');
      } else if (msg.id === 'claw') {
        uart.write('c' + (msg.pos < 10 ? '0' : '') + msg.pos + '\n');
      } else if (msg.id === 'shoot') {
        uart.write('s' + '\n');
      } else if (msg.id === 'move') {
        if (state.mode === 'manual') {
          uart.write('m' + msg.dir + (msg.spd < 10 ? '0' : '') + msg.spd + "\n");
        } else if (state.mode === 'navigate') {
          uart.write('g' + msg.dir + "\n");
        }
      }
    }
  });

  function sendUartData(data) {
    // Data from uart is in JSON
    log.verbose("UART data received: " + data);
    var parsed = {}
    try {
      parsed = JSON.parse(data);
    } catch(e) {
      log.warn("UART is not JSON: " + e)
    }
    try {
      if (parsed.id === 'encoder' ||
          parsed.id === 'ir' ||
          parsed.id === 'claw') {
        ws.send(data);
      } else if (parsed.id === 'shoot') {
        ws.send(JSON.stringify({ id:'shoot', num: state.num_shots }));
      }
    } catch(e) {
      log.warn("UART: " + e);
      uart.removeListener('data', sendUartData);
    }
  };
  uart.on('data', sendUartData);

}
