var log = require('winston');
log.add(log.transports.File, { filename: 'beaglebone.log' });
log.info("Starting program");

var http = require('http');
var fs = require('fs');
var url = require('url');
var cv = require('cv');
var express = require('express');
var WebSocketServer = require('ws');
var serialport = require('serialport')
var Uart = serialport.SerialPort;
var exec = require('child_process').exec;

process.on( 'SIGINT', function() {
  cv.ReleaseCapture(capture);
  process.exit();
})

process.on('uncaughtException', function(err) {
  console.error(err.stack);
  cv.ReleaseCapture(capture);
  process.exit();
});

var capture = cv.CreateCameraCapture(0);
cv.SetCaptureProperty(capture, cv.CV_CAP_PROP_FRAME_WIDTH, 162);
cv.SetCaptureProperty(capture, cv.CV_CAP_PROP_FRAME_HEIGHT, 122);
log.info("Camera is up");
var frame = cv.QueryFrame(capture);
var grabFrame = function() {
  // cv.QueryFrame(capture);
}
setInterval(grabFrame, 200);

exec('echo 6 > /sys/kernel/debug/omap_mux/gpmc_wpn && ' +
     'echo 26 > /sys/kernel/debug/omap_mux/gpmc_wait0 ',
  function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    } else {
      var uart = new Uart('/dev/ttyO4', {
        baudrate: 115200,
        parser: serialport.parsers.readline("\n")
      });
      uart.on("open", function () {
        console.log('UART Open');
        runServer(uart)
      });
    }
});


function runServer (uart) {
  var app = express();
  app.use(express.static(__dirname + '/public'));
  var server = http.createServer(app);
  server.listen(8080);
  var wss = new WebSocketServer({server:server});

  wss.on('connection', function (ws) {
    wsHandler(ws, uart);
  });

  // function handler (req, res) {
  //   log.info ('Requesting ' + req.url);
  //   var request = url.parse(req.url, true);
  //   var action = request.pathname;
  //   if (action === '/cam.png') {
  //     cv.SaveImage.async('./cam.png', frame, function(err) {
  //       fs.readFile('./cam.png', function(err, img) {
  //         res.writeHead(200, {'Content-Type': 'image/png' });
  //         res.end(img, 'binary');
  //       });
  //     });
  //   // } else if (action === '/')
  //   } else {
  //     fs.readFile(__dirname + '/index.html',
  //       function (err, data) {
  //         if (err) {
  //           res.writeHead(500);
  //           return res.end('Error loading index.html');
  //         }

  //         res.writeHead(200);
  //         res.end(data);
  //       }
  //     );
  //   }
  // }
}

function wsHandler(ws, uart) {
  ws.on('message', function(data, flags) {
    if (!flags.binary) {
      var message = JSON.parse(data);
      log.info(message);
      if (message.id === 'led') {
        uart.write('l' + data.num +'\n');
      } else if (message.id === 'move') {
        uart.write('m' + data.dir + (data.spd < 10 ? '0' : '') + data.spd + "\n");
      } else if (message.id === 'enc') {
        uart.write('e'+"\n");
      }
    }
  });
  uart.on('data', function(data) {
    log.debug("UART data received: " + data);
    try {
      data = data.split(',');
      ws.send(JSON.stringify(data));
    } catch(e) {
      log.warn(e);
    }
  });
}
