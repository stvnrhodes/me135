var log = require('winston');
log.add(log.transports.File, { filename: 'beaglebone.log' });
log.info("Starting program");

var express = require('express');
var http = require('http');
var fs = require('fs');
var url = require('url');
var WebSocketServer = require('ws').Server;
var serialport = require('serialport')
var Uart = serialport.SerialPort;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var async = require('async');
var cmd = 'mjpg-streamer/mjpg_streamer';
var args = ['-i','mjpg-streamer/input_uvc.so -r 640x480',
            '-o','mjpg-streamer/output_http.so -p 8081',
            '-o','mjpg-streamer/output_opencv.so']
var vision = spawn(cmd, args);

var Maze = require('./public/maze.js').Maze;
var Cell = require('./public/maze.js').Cell;

vision.stdout.on('data', function (data) {
  log.info('stdout: ' + data);
});

vision.stderr.on('data', function (data) {
  log.warn('stderr: ' + data);
});

vision.on('close', function (code) {
  log.info('child process exited with code ' + code);
});

// process.on( 'SIGINT', function() {
//   log.warn("Kill signal recieved");
//   process.exit();
// })

// process.on('uncaughtException', function(err) {
//   log.error(err.stack);
//   vision.stdin.write('q');
//   process.exit();
// });


var uart = new Uart('/dev/ttyO4', {
  baudrate: 115200,
  parser: serialport.parsers.readline("\n")
});
uart.on("open", function () {
  log.info('UART Open');
  runServer(uart)
});


function runServer (uart) {
  log.info("Starting Server");
  var app = express();
  app.use(express.static(__dirname + '/public'));

  var server = http.createServer(app);
  server.listen(8080);

  var wss = new WebSocketServer({server: server});
  wss.on('connection', function (ws) {
    wsHandler(ws, uart);
  });

}

function wsHandler(ws, uart) {
  log.info("Running websockets");
  ws.on('message', function(data, flags) {
    if (!flags.binary) {
      log.info("Websocket message:" + data);
      var msg = JSON.parse(data);
      if (msg.id === 'led') {
        log.info("Toggling LED " + msg.num);
        uart.write('l' + msg.num +'\n');
      } else if (msg.id === 'move') {
        uart.write('m' + msg.dir + (msg.spd < 10 ? '0' : '') + msg.spd + "\n");
      } else if (msg.id === 'enc') {
        uart.write('e'+"\n");
      }
    }
  });
  log.info("Sending random maze");
  uart.on('data', function(data) {
    log.debug("UART data received: " + data);
    try {
      data = data.split(',');
      ws.send(JSON.stringify(data));
    } catch(e) {
      log.warn(e);
    }
  });
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
        log.error(error);
        clearInterval(mazeDrawer);
      }
    });
  }, 250);
}
