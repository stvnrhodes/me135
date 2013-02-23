var fs = require('fs');
var url = require('url');

var cv = require('opencv');
// var camera = new cv.VideoCapture(0);


var serialport = require('serialport')
var Uart = serialport.SerialPort;
var uart;

var exec = require('child_process').exec;

var child = exec('echo 6 > /sys/kernel/debug/omap_mux/gpmc_wpn && ' +
                 'echo 26 > /sys/kernel/debug/omap_mux/gpmc_wait0 ',
  function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    } else {
      uart = new Uart('/dev/ttyO4', {
        baudrate: 115200,
        parser: serialport.parsers.readline("\n")
      });
      uart.on("open", function () {
        console.log('UART Open');
        runServer()
      });
    }
});


function runServer () {
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
    socket.on('led', function (data) {
      log.info("Writing to LED " + data.num)
      uart.write(data.num);
    });
    uart.on('data', function(data) {
      log.debug("data received: " + data);
      try {
        data = JSON.parse(data);
        socket.emit(data.id, data);
      } catch(e) {
        log.warn(e);
      }
    });
  });
}

// setInterval( function() {
//   camera.read(function(im) {
//     im.line([0,0], [100,100])
//     im.save('./cam.png');
//   });
// }, 1000);

// console.log(Object.getOwnPropertyNames(camera).sort())
// camera.set('CV_CAP_PROP_FRAME_WIDTH', 160);
// camera.set('CV_CAP_PROP_FRAME_HEIGHT', 120);
// camera.set('CV_CAP_PROP_FPS', 5);

