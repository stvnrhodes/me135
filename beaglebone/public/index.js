// Set up websockets
if (!window.WebSocket) {
  alert("WebSocket NOT supported by your Browser! This whole thing's gonna fail");
}
var host = window.document.location.host
var domain = host.replace(/:.*/, '');
var ws;

// Convenience function so we don't keep writing JSON.stringify
function wsSend(msg) {
  ws.send(JSON.stringify(msg));
}

// Main function
function onLoad() {
  ws = new WebSocket('ws://' + host);
  ws.onmessage = wsHandler();
  var speed = 50;
  $('#livefeed').css('background-image','url(\'http://' + domain +
      ':8081/?action=stream\')');
  $('#speed').html(speed);
  ws.onopen = function() {
    $(document).keydown ( function ( event ) {
      var keypress = String.fromCharCode(event.keyCode)
      if (keypress === 'W') {  // 'W'
        wsSend({ id:'move', dir:'f', spd:speed });
      } else if (keypress === 'A') {
        wsSend({ id:'move', dir:'l', spd:speed });
      } else if (keypress === 'S') {
        wsSend({ id:'move', dir:'b', spd:speed });
      } else if (keypress === 'D') {
        wsSend({ id:'move', dir:'r', spd:speed });
      } else if (keypress === ' ') {
        wsSend({ id:'move', dir:'s', spd:speed });
      } else if (keypress === 'O') {
        wsSend({ id:'claw', pos:99 }); // Open claw
      } else if (keypress === 'P') {
        wsSend({ id:'claw', pos:0 });
      } else if (keypress === 'I') {
        wsSend({ id:'shoot' });
      } else if (keypress === 'X') {
        if (speed < 99) {
          speed += 1;
        }
        $('#speed').html(speed);
      } else if (keypress === 'Z') {
        if (speed > 0) {
          speed -= 1;
        }
        $('#speed').html(speed);
      }
    });
    $(document).keyup( function(event) {
      var k = String.fromCharCode(event.keyCode);
      if ( k.match(/[WASD]/) ) {
        wsSend({ id:'move', dir:'s', spd:0 });
      }
    });

    $('#LED1').click( function() { wsSend({ id:'led', num: 1 }); });
    $('#LED2').click( function() { wsSend({ id:'led', num: 2 }); });
    $('#LED3').click( function() { wsSend({ id:'led', num: 3 }); });
    $('#LED4').click( function() { wsSend({ id:'led', num: 4 }); });
    $('#robopath').click( mazeClick );
    $('#livefeed').click( feedClick );

    $('#check-walls').click( function() { wsSend({ id:'check-walls' }) });
    $('#reset-maze').click( function() { wsSend({ id:'reset-maze' }) });

    var switch_mode = function(mode) {
      return function() { wsSend({ id:'state', state:mode }); };
    };

    $('#explore-tab').change(switch_mode('explore'))
    $('#navigate-tab').change(switch_mode('navigate'))
    $('#manual-tab').change(switch_mode('manual'))

    $('#shoot-toggle:checkbox').change( function(e) {
      wsSend({ id:'shoot-mode', mode:e.target.checked })
    });
  }
}

function wsHandler() {
  var ir_graph = new Plot('#ir-graph', ["Front", "Left", "Right", "Claw"]);
  var enc_graph = new Plot('#enc-graph', ["Left", "Right"]);
  return function(event) {
    var data = JSON.parse(event.data);
    if (data.id === 'encoder') {
      $('#enc-left-number').html(data.left.toFixed(2) + " in/s");
      $('#enc-right-number').html(data.right.toFixed(2) + " in/s");
      enc_graph.push(data.left, 0);
      enc_graph.push(data.right, 1);
      enc_graph.draw()
    } else if (data.id === 'maze') {
      var maze = new Maze(data.maze);
      var cell = new Cell(data.cell, maze);
      var canvas = $('#robopath')[0];
      clear_canvas(canvas);
      drawMaze(maze, cell, canvas);
    } else if (data.id === 'moments') {
      var x, y, color
      var canvas = $('#livefeed')[0];
      clear_canvas(canvas)
      x = data['0m10']/data['0m00'];
      y = data['0m01']/data['0m00'];
      color = $('#ally-colored').css('color');
      drawCircle(x, y, Math.sqrt(data['0m00'])/20, color, canvas);
      x = data['1m10']/data['1m00'];
      y = data['1m01']/data['1m00'];
      color = $('#enemy-colored').css('color');
      drawCircle(x, y, Math.sqrt(data['1m00'])/20, color, canvas);
    } else if (data.id === 'ir') {
      $('#ir-front-number').html(data.front.toFixed(2) + " in");
      $('#ir-left-number').html(data.left.toFixed(2) + " in");
      $('#ir-right-number').html(data.right.toFixed(2) + " in");
      $('#ir-claw-number').html(data.claw.toFixed(2) + " in");
      ir_graph.push(data.front,0);
      ir_graph.push(data.left,1);
      ir_graph.push(data.right,2);
      ir_graph.push(data.claw,3);
      ir_graph.draw();
    } else if (data.id === 'claw') {
      $('#claw-pos-number').html(data.pos.toFixed(0) + '%');
    } else if (data.id === 'shoot') {
      $('#shots-fired-number').html(data.num.toString());
    } else if (data.id === 'state') {
      if (data.state === 'explore') {
        $('#explore-tab').attr('checked', true);
      } else if (data.state === 'manual') {
        $('#manual-tab').attr('checked', true);
      } else if (data.state === 'navigate') {
        $('#navigate-tab').attr('checked', true);
      }
    } else if (data.id === 'color') {
      $('#ally-colored').css('color', data.ally);
      $('#enemy-colored').css('color', data.enemy)
    } else if (data.id === 'shoot-mode') {
      $('#shoot-toggle:checkbox')[0].checked = data.mode;
    }
  }
}

function clear_canvas(canvas) {
  if (canvas.getContext) {

    var ctx = canvas.getContext('2d');
    // Store the current transformation matrix
    ctx.save();

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Restore the transform
    ctx.restore();
  }
}

function drawCircle(x, y, r, color, canvas) {
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}

// Eww, a global! Be wary.
var mazeClickInfo = {};

// This function will be somewhat confusing because the maze uses
// x as row number and y as column number instead of x as width
// and y as height
function drawMaze(maze, cell, canvas){
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');

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
    var yOffset = (mazeSize === width ? BORDER / 2
                  : Math.floor(((height - width) * cellSize + BORDER)/2));
    var xOffset = (mazeSize === height ? BORDER / 2
                  : Math.floor(((width - height) * cellSize + BORDER)/2));
    // Cheat by using a global, hackish
    mazeClickInfo.cellSize = cellSize;
    mazeClickInfo.xOffset = xOffset;
    mazeClickInfo.yOffset = yOffset;
    mazeClickInfo.x0 = x0;
    mazeClickInfo.y0 = y0;
    mazeClickInfo.cell = cell;

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

    wsSend({id:'navigate', x:x+mazeClickInfo.x0, y:y+mazeClickInfo.y0 });
  }
}

function feedClick(evt) {
  var coords = $('#livefeed')[0].relMouseCoords(evt);
  coords.id = 'pic_xy';
  // O for ally, 1 for enemy
  coords.type = parseInt($('#cam-colors [type=radio]:checked')[0].value);
  console.log(coords)
  wsSend(coords);
}

