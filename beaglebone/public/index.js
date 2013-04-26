// Set up websockets
if (!window.WebSocket) {
  alert("WebSocket NOT supported by your Browser! This whole thing's gonna fail");
}
var host = window.document.location.host.replace(/:.*/, '');
var ws;

// Convenience function so we don't keep writing JSON.stringify
function wsSend(msg) {
  ws.send(JSON.stringify(msg));
}

// Main function
function onLoad() {
  if (host.match(/([0-9]+\.){3}[0-9]+/)) {
    ws = new WebSocket('ws://' + host + ':8080');
  } else {
    ws = new WebSocket('ws://' + host);
  }
  ws.onmessage = wsHandler();
  var speed = 5;
  $('#livefeed').css('background-image','url(\'http://'+host+':8081/?action=stream\')');
  // $('#livefeed').attr('src','http://'+host+':8081/?action=stream');
  $('#speed').html(speed);
  ws.onopen = function() {
    $(document).keydown ( function ( event ) {
      if(event.keyCode === 87) {  // 'W'
        wsSend({ id:'move', dir:'f', spd:speed });
      }
      else if(event.keyCode === 65) {  // 'A'
        wsSend({ id:'move', dir:'l', spd:speed });
      }
      else if(event.keyCode === 83) {  // 'S'
        wsSend({ id:'move', dir:'b', spd:speed });
      }
      else if(event.keyCode === 68) {  // 'D'
        wsSend({ id:'move', dir:'r', spd:speed });
      }
      else if(event.keyCode === 32) {  // Space bar
        wsSend({ id:'move', dir:'s', spd:speed });
      }
      else if(event.keyCode === 88) { // 'X'
        if (speed < 10) {
          speed += 1;
        }
        $('#speed').html(speed);
      }
      else if(event.keyCode === 90) { // 'Z'
        if (speed > 0) {
          speed -= 1;
        }
        $('#speed').html(speed);
      }
    });
    $(document).keyup( function(event) {
      var k = event.keyCode;
      if ( k === 87 || k === 65 || k === 83 || k === 68 ) {  // 'WASD'
        //wsSend({ id:'move', dir:'s', spd:0 });
      }
    });
    $('#Cam').click(function () {
      $('img').attr('src', "cam.jpg");
    } );
    $('#LED1').click(function () { wsSend({ id:'led', num: 1 } ); });
    $('#LED2').click( function() { wsSend({ id:'led', num: 2 } ); });
    $('#LED3').click( function() { wsSend({ id:'led', num: 3 } ); });
    $('#LED4').click( function() { wsSend({ id:'led', num: 4 } ); });
    $('#robopath').click ( mazeClick );
    $('#livefeed').click ( feedClick );
  }
}

function wsHandler() {
  var ir_graph = new Plot('#ir-graph', ["Front", "Left", "Right"]);
  var enc_graph = new Plot('#enc-graph', ["Left", "Right"]);
  return function(event) {
    var data = JSON.parse(event.data);
    if (data.id === 'encoder') {
      $('#enc-left-number').html(data.left_encoder.toFixed(2) + " f/s");
      $('#enc-right-number').html(data.right_encoder.toFixed(2) + " f/s");
      enc_graph.push(data.left_encoder, 0);
      enc_graph.push(data.right_encoder, 1);
      enc_graph.draw()
    } else if (data.id === 'maze') {
      var maze = new Maze(data.maze);
      var cell = new Cell(data.cell, maze);
      drawMaze(maze, cell, $('#robopath')[0]);
    } else if (data.id === 'moments') {
      var x = data.m10/data.m00;
      var y = data.m01/data.m00;
      drawCircle(x, y, Math.sqrt(data.m00)/20, $('#livefeed')[0]);
    } else if (data.id === 'ir') {
      $('#ir-front-number').html(data.front.toFixed(2) + " in");
      $('#ir-left-number').html(data.left.toFixed(2) + " in");
      $('#ir-right-number').html(data.right.toFixed(2) + " in");
      ir_graph.push(data.front,0);
      ir_graph.push(data.left,1);
      ir_graph.push(data.right,2);
      ir_graph.draw();
    }
  }
}



function drawCircle(x, y, r, canvas) {
  if (canvas.getContext) {

    var ctx = canvas.getContext('2d');
    // Store the current transformation matrix
    ctx.save();

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Restore the transform
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
  }
}

// Eww, a global! Be wary.
var mazeClickInfo;

// This function will be somewhat confusing because the maze uses
// x as row number and y as column number instead of x as width
// and y as height
function drawMaze(maze, cell, canvas){
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');

    // Store the current transformation matrix
    ctx.save();

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Restore the transform
    ctx.restore();

    var corners = maze.getCorners();
    var x0 = corners[0][0];
    var y0 = corners[0][1];
    var x1 = corners[1][0];
    var y1 = corners[1][1];
    var height = x1 - x0;
    var width = y1 - y0;
    var mazeSize = (height > width ? height : width);
    var BORDER = 10;
    // Cell size in pixels, 10 pixel border, add 1 b/c 0 indexed
    var cellSize = Math.floor((canvas.width - BORDER) / (mazeSize));
    var wall_width = Math.floor(cellSize/20);
    if (wall_width === 0) {
      wall_width = 1;
    }
    console.log(corners)
    var yOffset = (mazeSize === width ? BORDER / 2
                  : Math.floor(((height - width) * cellSize + BORDER)/2));
    var xOffset = (mazeSize === height ? BORDER / 2
                  : Math.floor(((width - height) * cellSize + BORDER)/2));
    mazeClickInfo = {cellSize:cellSize, xOffset:xOffset, yOffset:yOffset, x0:x0, y0:y0};

    // Draw grey for unexplored cells, white for explored
    var drawCell = function(x, y) {
      x = (x - x0) * cellSize + xOffset;
      y = (y - y0) * cellSize + yOffset;
      ctx.fillRect (y, x, cellSize, cellSize);
    };

    // Draw explored areas
    for (var x = x0; x < x1; x++) {
      for (var y = y0; y < y1; y++) {
        if (maze.isExplored(x,y)) {
          ctx.fillStyle = "rgb(255,255,255)";
        } else {
          ctx.fillStyle = "rgb(200,200,200)";
        }
        drawCell(x, y);
      }
    }

    // Draw wall to right of cell
    var drawVertWall = function (x, y) {
      x = (x - x0) * cellSize + xOffset - wall_width/2;
      y = (y - y0 + 1) * cellSize + yOffset - wall_width/2;
      ctx.fillRect(y, x, wall_width, cellSize + wall_width);
    };

    // Draw wall at bottom of cell
    var drawHorizWall = function(x, y) {
      x = (x - x0 + 1) * cellSize + xOffset - wall_width/2;
      y = (y - y0) * cellSize + yOffset - wall_width/2;
      ctx.fillRect(y, x, cellSize + wall_width, wall_width);
    };

    ctx.fillStyle = "rgb(0,0,0)";
    // Draw left side
    for (var x = x0; x < x1; x++) {
      if (maze.isWall(x,y0-1,x,y0)) {
        drawVertWall(x, y0-1);
      }
    }
    // Draw top
    for (var y = y0; y < y1; y++) {
      if (maze.isWall(x0-1,y,x0,y)) {
        drawHorizWall(x0-1, y)
      }
    }
    // Draw the rest
    for (var x = x0; x < x1; x++) {
      for (var y = y0; y < y1; y++) {
        if (maze.isWall(x,y,x,y+1)) {
          drawVertWall(x,y);
        }
        if (maze.isWall(x,y,x+1,y)) {
          drawHorizWall(x, y);
        }
      }
    }

    var drawTriangle = function(x,y,dir) {
      x = (x - x0) * cellSize + xOffset;
      y = (y - y0) * cellSize + yOffset;
      // Translate canvas to center, rotate to correct angle, then make triangle
      ctx.translate(y + cellSize/2, x + cellSize/2);
      ctx.scale(cellSize, cellSize);
      ctx.rotate(-dir*Math.PI/2)
      ctx.beginPath();
      ctx.moveTo(-1/4,1/3);
      ctx.lineTo(0,-1/3);
      ctx.lineTo(1/4,1/3);
      ctx.fill();
      ctx.rotate(dir*Math.PI/2)
      ctx.scale(1/cellSize, 1/cellSize);
      ctx.translate(-y - cellSize/2, -x - cellSize/2)
    }
    if (cell) {
      ctx.fillStyle = "rgb(255,0,0)";
      var data = cell.getData();
      drawTriangle(data[0],data[1],data[2]);
    }
  }
}

function mazeClick(evt) {
  if (mazeClickInfo) {
    var coords = $('#robopath')[0].relMouseCoords(evt);
    var x = Math.floor((coords.y - mazeClickInfo.xOffset) / mazeClickInfo.cellSize);
    var y = Math.floor((coords.x - mazeClickInfo.yOffset) / mazeClickInfo.cellSize);
    $('#mazeCoord').html("Cell clicked: " + (x+mazeClickInfo.x0) + "," +
        (y+mazeClickInfo.y0));
  }
}

function feedClick(evt) {
  var coords = $('#livefeed')[0].relMouseCoords(evt);
  coords.id = "pic_xy";
  wsSend(coords);
}

