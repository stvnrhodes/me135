var fs = require('fs');
var url = require('url');

var cv = require('opencv');
// var camera = new cv.VideoCapture(0);

var serialport = require('serialport')
var Uart = serialport.SerialPort;

var exec = require('child_process').exec;

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
  var app = require('http').createServer(handler);
  var io = require('socket.io').listen(app);
  var log = io.log;

  // io.enable('browser client minification');
  app.listen(8001);

  function handler (req, res) {
    var request = url.parse(req.url, true);
    var action = request.pathname;
    if (action == '/cam.png') {
      camera.read(function(im) {
        im.line([0,0], [100,100])
        im.save('./cam.png');
        fs.readFile('./cam.png',
          function(err, img) {
            res.writeHead(200, {'Content-Type': 'image/png' });
            res.end(img, 'binary');
          }
        );
      });
    } else {
      fs.readFile(__dirname + '/index.html',
        function (err, data) {
          if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
          }

          res.writeHead(200);
          res.end(data);
        }
      );
    }
  }

  io.sockets.on('connection', function (socket) {
    socket.on('led', function(data) {
      log.info("Writing to LED " + data.num)
      uart.write(JSON.stringify(data)+'\n');
    });
    socket.on('move', function(data) {
      log.info("Moving " + data.dir + " at " + data.spd);
      uart.write(JSON.stringify(data)+"\n");
    });
    socket.on('enc', function(data) {
      log.info("Doing encoder action " + data.action);
      uart.write(JSON.stringify(data)+"\n");
    });
    uart.on('data', function(data) {
      log.debug("UART data received: " + data);
      try {
        data = JSON.parse(data);
        socket.emit(data.id, data);
      } catch(e) {
        log.warn(e);
      }
    });
  });
}
