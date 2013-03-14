if (!window.WebSocket) {
  alert("WebSocket NOT supported by your Browser! This whole thing's gonna fail");
}
var host = window.document.location.host.replace(/:.*/, '');
var ws = new WebSocket('ws://' + host + ':8080');


function onLoad() {
  m = new Maze(10,10);
  m.setExplored(1,1);
  m.setExplored(4,6);
  m.setExplored(4,7);
  m.setExplored(3,7);
  m.addWall([4,7],[4,6]);
  m.addWall([4,7],[3,7]);
  drawMaze(m, $('#robopath')[0]);
  setTimeout(function() {
    m.setExplored(5,5);
    m.setExplored(7,6);
    drawMaze(m, $('#robopath')[0]);
  }, 1000);
  ws.onMessage = onMessage;
  var speed = 5;
  function wsSend(msg) {
    ws.send(JSON.stringify(msg));
  }
  $('#speed').html(speed);
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
      wsSend({ id:'move', dir:'s', spd:0 });
    }
  });
  $('#Cam').click(function () {
    $('img').attr('src', "cam.jpg");
  } );
  $('#LED1').click(function () {
    wsSend({ id:'led', num: 1 } );
  });
  $('#LED2').click ( function() {
    wsSend({ id:'led', num: 2 } );
  });
  $('#resetEncoder').click ( function () {
    wsSend({ id:'enc', action: 'rst' });
  });
}

function onMessage(event) {
  data = JSON.parse(event.data);
  if (data.id === 'b') {
    buttonText = $('#buttonText');
    if (data.val) {
      buttonText.html("not pressed");
    } else {
      buttonText.html("pressed");
    }
  } else if (data.id === 'ctr') {
    $('#counterText').html(data.val.toString());
  } else if (data.id === 'e') {
    $('#lEnc').html(data[1]);
    $('#rEnc').html(data[2]);
  } else if (data.id === 'maze') {
    var maze = new Maze(1,1);
    maze.changeMaze(data.maze);
    drawMaze(maze, $('#robopath')[0]);
  }
}

function drawMaze(maze, canvas){
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
    var height = y1 - y0;
    var width = x1 - x0;
    var mazeSize = (height > width ? height : width);
    var BORDER = 10;
    var WALL_WIDTH = 4;
    // Cell size in pixels, 10 pixel border, add 1 b/c 0 indexed
    var cellSize = Math.floor((canvas.width - BORDER) / (mazeSize + 1));
    var xOffset = (mazeSize === width ? BORDER / 2
                  : Math.floor(((height - width) * cellSize + BORDER)/2));
    var yOffset = (mazeSize === height ? BORDER / 2
                  : Math.floor(((width - height) * cellSize + BORDER)/2));

    // Draw grey for unexplored cells, white for explored
    var drawCell = function(x, y) {
      x = (x - x0) * cellSize + xOffset;
      y = (y - y0) * cellSize + yOffset;
      ctx.fillRect (x, y, cellSize, cellSize);
    };

    // Draw explored areas
    for (var x = x0; x <= x1; x++) {
      for (var y = y0; y <= y1; y++) {
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
      x = (x - x0 + 1) * cellSize + xOffset - WALL_WIDTH/2;
      y = (y - y0) * cellSize + yOffset - WALL_WIDTH/2;
      ctx.fillRect(x, y, WALL_WIDTH, cellSize + WALL_WIDTH);
    };

    // Draw wall at bottom of cell
    var drawHorizWall = function(x, y) {
      x = (x - x0) * cellSize + xOffset - WALL_WIDTH/2;
      y = (y - y0 + 1) * cellSize + yOffset - WALL_WIDTH/2;
      ctx.fillRect(x, y, cellSize + WALL_WIDTH, WALL_WIDTH);
    };

    ctx.fillStyle = "rgb(0,0,0)";
    // Draw top
    // Draw left side
    // Draw the rest
    for (var x = x0; x <= x1; x++) {
      for (var y = y0; y <= y1; y++) {
        if (maze.isWall([x,y],[x,y+1])) {
          drawHorizWall(x, y);
        }
        if (maze.isWall([x,y],[x+1,y])) {
          drawVertWall(x,y);
        }
      }
    }
    drawVertWall(x0-1, y0);
    drawHorizWall(x0, y0-1);

  }
}
