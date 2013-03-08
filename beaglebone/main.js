var log = require('winston');
log.add(log.transports.File, { filename: 'beaglebone.log' });
log.info("Starting program");

var fs = require('fs');
var url = require('url');
var cv = require('cv');
var WebSocketServer = require('ws').Server;
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
var start = (new Date).getTime();
var frame = cv.QueryFrame(capture);
var diff = (new Date).getTime() - start;
log.info(diff);
var grabFrame = function() {
  cv.QueryFrame.async(capture, function() {});
}
setInterval(grabFrame, 500);

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
        log.info('UART Open');
        runServer(uart)
      });
    }
});


function runServer (uart) {
  log.info("Starting Server");
  var server = require('http').createServer(handler);
  var wss = new WebSocketServer({server: server});

  server.listen(8080);

  wss.on('connection', function (ws) {
    wsHandler(ws, uart);
  });

  function handler (req, res) {
    log.info ('Requesting ' + req.url);
    var request = url.parse(req.url, true);
    var action = request.pathname;
    if (action === '/cam.png') {
      cv.SaveImage.async('./cam.png', frame, function(err) {
        fs.readFile('./cam.png', function(err, img) {
          res.writeHead(200, {'Content-Type': 'image/png' });
          res.end(img, 'binary');
        });
      });
    } else if (action === '/') {
      fs.readFile(__dirname + '/public/index.html',
        function (err, data) {
          if (err) {
            res.writeHead(500);
            return res.end("Error loading index.html");
          }

          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(data);
        }
      );
    } else {
      fs.readFile(__dirname + '/public' + action,
        function (err, data) {
          if (err) {
            res.writeHead(500);
            return res.end("Error loading " + action);
          }
          if (action.match(/.js$/)) {
            header = {'Content-Type': 'text/javascript'};
          } else {
            header = {'Content-Type': 'text/html'};
          }
          res.writeHead(200, header);
          res.end(data);
        }
      );
    }
  }
}

function wsHandler(ws, uart) {
  ws.on('message', function(data, flags) {
    if (!flags.binary) {
      log.info(data);
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
