// Set up logging first
var log = require('winston');
// log.add(log.transports.File, { filename: 'beaglebone.log', timestamp:true });
var fs = require('fs');
fs.unlink('public/log.log', function() {
  log.add(log.transports.File, { filename: 'public/log.log', timestamp:true });
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
var Maze = require('./public/maze.js').Maze;
var Cell = require('./public/maze.js').Cell;

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

  var wss = new WebSocketServer({server: server});
  wss.on('connection', function (ws) {
    tripleHandler(ws, socket, uart);
  });

}

function tripleHandler(ws, socket, uart) {
  log.info("Running websockets");
  var maze = new Maze();
  var cell = new Cell(0, 0, 'N', maze);

  ws.on('message', function(data, flags) {
    if (!flags.binary) {
      log.info("Websocket message:" + data);
      var msg = JSON.parse(data);
      if (msg.id === 'led') {
        log.info("Toggling LED " + msg.num);
        uart.write('l' + msg.num +'\n');
      } else if (msg.id === 'move') {
        if (msg.dir === 'f') {
          cell.move(1);
        } else if (msg.dir === 'l' || msg.dir === 'r') {
          cell.turn(msg.dir);
        }
        uart.write('g' + msg.dir + (msg.spd < 10 ? '0' : '') + msg.spd + "\n");
      } else if (msg.id == 'pic_xy') {
        try {
          socket.write(data);
        } catch(e) {
          log.error("Socket fail: " + e);
        }
      }
    }
  });

  uart.on('data', sendUartData);
  function sendUartData(data) {
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
      if (parsed.left) { cell.addWall('L'); }
      else { cell.addConnect('L'); }
      if (parsed.center) { cell.addWall('F'); }
      else { cell.addConnect('F'); }
      if (parsed.right) { cell.addWall('R'); }
      else { cell.addConnect('R'); }
      var msg = {id:'maze', maze:maze.getData(), cell:cell.getData()};
      data = JSON.stringify(msg);
    }
    try {
      ws.send(data);
    } catch(e) {
      log.warn("UART: " + e);
      uart.removeListener('data', sendUartData);
    }
  };
  // Get initial walls
  uart.write('w')

  socket.on('data', sendCvData);
  function sendCvData(data) {
    log.verbose('OpenCV data received: ' + data);
    try {
      var msg = JSON.parse(data);
      if (msg.id === 'moments') {
        ws.send(data, function(error) {
          if (error) {
            log.warn('ws: ' + error);
            socket.removeListener('data', sendCvData);
          }
        });
      }
    } catch(e) {
      log.warn("Socket: " + e);
    }
  }

  // Included for testing
  // randomMaze(ws);
}

// Create a random maze and continually update it, useful for testing
function randomMaze (ws) {
  log.verbose("Sending random maze");
  var m = new Maze();
  var i = 0;
  var j = 0;
  var dir = 'E';
  var directions = ['N','S','E','W'];
  var mazeDrawer = setInterval(function() {
    var chance = Math.random() * 4;
    if (chance < 1) {
      j++;
      dir = 'E';
    } else if (chance < 2) {
      j--;
      dir = 'W';
    } else if (chance < 3) {
      i++;
      dir = 'S';
    } else if (chance < 4) {
      i--;
      dir = 'N';
    }

    var c = new Cell(i, j, dir, m);
    c.addWall('L');
    var msg = {id:'maze', maze:m.getData(), cell:c.getData()};
    ws.send(JSON.stringify(msg), function(error) {
      if (error) {
        log.error("Websocket " + error);
        clearInterval(mazeDrawer);
      }
    });
  }, 100);
}