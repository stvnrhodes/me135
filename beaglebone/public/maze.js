// Maze data only stores every other cell
//  Here's a 6x6 maze, XY.  We organize it as 3Wx6H.
//  00  20  40
//    11  31  51
//  02  22  42
//    13  33  53
//  04  35  44
//    15  35  55
// Conveniently, only cells that add up to even numbers are present.

// Each cell in the maze is represented by 10 bits
//     /------------ Cell to the left is explored
//     |/----------- Cell is Explored
//     || /--------- North Discovered
//     || |/-------- West Discovered
//     || ||/------- South Discovered
//     || |||/------ East Discovered
//     || |||| /---- North is Wall
//     || |||| |/--- West is Wall
//     || |||| ||/-- South is Wall
//     || |||| |||/- East is Wall
// 0b1111 1111 1111

// Make a maze of height x and width y.
// This should be at least twice as big as the actual maze
// This is because the real maze edges need to be inside the data structure
// and we can start anywhere in the maze
Maze = function(m) {
  if (arguments.length == 1) {
    // Fix me!!!
    this.maze = JSON.parse(m);
  } else {
    this.node_list = [[new Node()]];
    this.xOffset = 0;
    this.yOffset = 0;
  }
};

// Resize maze if we're trying to access sonething out of bounds
Maze.prototype._node = function(x, y) {
  while (x + this.xOffset < 0) {  // Add row to top
    var row = [];
    for (var i = this.getWidth() - 1; i >= 0; i--) {
      row.push(new Node());
    };
    this.node_list.unshift(row);
    this.xOffset++;
  }
  while (y + this.yOffset < 0) {  // Add column to left
    this.node_list.forEach(function(elem) {
      elem.unshift(new Node());
    });
    this.yOffset++;
  }
  while (x + this.xOffset >= this.getHeight()) {  // Add row to bottom
    var row = [];
    for (var i = this.getWidth() - 1; i >= 0; i--) {
      row.push(new Node());
    };
    this.node_list.push(row);
  }
  while (y + this.yOffset >= this.getWidth()) { // Add column to right
    this.node_list.forEach(function(elem) {
      elem.push(new Node());
    });
  }
  return this.node_list[x+this.xOffset][y+this.yOffset];
};

// The maze is just a graph
// Add edges to left, right
// Node we start at is 0,0
// We can try to usually start in the corner


Maze.prototype.getData = function() {
  // Todo: FIX!
  return JSON.stringify(this.maze);
};

Maze.prototype.getWidth = function() {
  return this.node_list[0].length;
}

Maze.prototype.getHeight = function() {
  return this.node_list.length;
}

// Cells are x, y tuples
Maze.prototype.setExplored = function(x, y) {
  this._node(x, y).setExplored();
};


Maze.prototype.isWall = function(x0, y0, x1, y1) {
  if (Math.abs(x1-x0) + Math.abs(y1-y0) === 1) { // Manhattan distance is 1
    return this._node(x0,y0).isWall(this._node(x1,y1));
  }
  return false;
};

Maze.prototype.isEdge = function(x0, y0, x1, y1) {
  if (Math.abs(x1-x0) + Math.abs(y1-y0) === 1) { // Manhattan distance is 1
    return this._node(x0,y0).isEdge(this._node(x1,y1));
  }
  return false;
};

Maze.prototype.addWall = function(x0, y0, x1, y1) {
  if (Math.abs(x1-x0) + Math.abs(y1-y0) === 1) { // Manhattan distance is 1
    var n0 = this._node(x0,y0);
    var n1 = this._node(x1,y1);
    n0.addWall(n1);
    n1.addWall(n0);
  }
};

Maze.prototype.addEdge = function(x0, y0, x1, y1) {
  if (Math.abs(x1-x0) + Math.abs(y1-y0) === 1) { // Manhattan distance is 1
    var n0 = this._node(x0,y0);
    var n1 = this._node(x1,y1);
    n0.addEdge(n1);
    n1.addEdge(n0);
  }
};

Maze.prototype.getPath = function(x0, y0, x1, y1) {
  var start = this._node(x0,y0);
  var end = this._node(x1,y1);
  // Do maze finding algorithm here
  // We'll do breadth-first search
  var node = start;
  var fringe = []
  var path = {}
  var node_edges = [];
  while (node !== end) {
    node_edges = node.getEdges();
    for (var i = 0; i < node_edges.length; i++) {
      var next_node = node_edges[i];
      if (!path[next_node.id]) {
        path[next_node.id] = node;
        fringe.push(next_node);
      }
    }
    node = fringe.shift(); // node is undefined if we empty the fringe
    if (!node) {
      return;
    }
  }
  var answer = [];
  while (node !== start){
    answer.unshift(node);
    node = path[node.id];
  }
  return answer;
};

Maze.prototype.getPathToUnknown = function(x,y) {
  // Probably do fill algorithm to find nearest unknown
  // Either getPath to an unknown, or do travelling salesman

};

Maze.prototype.isExplored = function(x, y) {
  return this._node(x, y).isExplored();
};

// The output is the right sizing to be used in a < for loop
Maze.prototype.getCorners = function(x, y) {
  var x0 = -this.xOffset;
  var y0 = -this.yOffset;
  var x1 = x0 + this.getHeight();
  var y1 = y0 + this.getWidth();
  return [[x0, y0], [x1, y1]];
}


// We want to be able to find node by number
// We also want to be able to dynamically change sizes
// 2-d node list!

// Nodes are the building blocks of mazes
Node = function(id) {
  this.explored = false;
  this.edges = [];
  this.walls = [];
  if (id) {
    this.id = id;
  } else {
    this.id = uid();
  }
};

Node.prototype.getEdges = function() {
  return this.edges;
};

Node.prototype.getWalls = function() {
  return thus.walls;
};

Node.prototype.addWall = function(node) {
  this.walls.push(node);
};

Node.prototype.addEdge = function(node) {
  this.edges.push(node)
};

Node.prototype.isEdge = function(node) {
  for (var i = this.edges.length - 1; i >= 0; i--) {
    if (this.edges[i] === node) {
      return true;
    }
  }
  return false;
};

Node.prototype.isWall = function(node) {
  for (var i = this.walls.length - 1; i >= 0; i--) {
    if (this.walls[i] === node) {
      return true;
    }
  }
  return false;
};

Node.prototype.isExplored = function() {
  return this.explored;
};

Node.prototype.setExplored = function() {
  this.explored = true;
};


// Provide a unique ID
var uid_gen = function() {
  var id = 0;
  return function() {
    id++;
    return id;
  }
}

var uid = uid_gen();



// This is the current cell
// Direction must be N, S, E, or W
// Alternatively, feed in getData as x and map as y
Cell = function(x, y, dir, maze) {
  if (arguments.length == 2) {
    this.x = x[0];
    this.y = x[1];
    this.dir = x[2]
    this.maze = y;
  } else {
    this.x = x;
    this.y = y;
    this.dir = Cell.dirTable[dir];
    this.maze = maze;
  }
  this.maze.setExplored(this.x, this.y);
};

// The dir table is CCW, mod 4, so we can add directions
//   0
// 1   3
//   2
Cell.dirTable = {
  N:0,
  W:1,
  S:2,
  E:3,
  n:0,
  w:1,
  s:2,
  e:3,
  F:0,
  L:1,
  B:2,
  R:3,
  f:0,
  l:1,
  b:2,
  r:3,
};

// Direction is F, R, L, or B
Cell.prototype.addWall = function(dir) {
  var direction = (Cell.dirTable[dir] + this.dir) % 4;
  var x = this.x;
  var y = this.y;
  if (direction === 0) {
    x === 0 ? x = this.maze.getHeight() : x = x - 1;
  } else if (direction === 1) {
    y === 0 ? y = this.maze.getWidth() : y = y - 1;
  } else if (direction === 2) {
    x === this.maze.getHeight() ? x = 0 : x = x + 1;
  } else if (direction === 3) {
    y === this.maze.getWidth() ? y = 0 : y = y + 1;
  }
  this.maze.addWall(this.x, this.y, x, y);
};

Cell.prototype.addConnect = function(dir) {
  var direction = (Cell.dirTable[dir] + this.dir) % 4;
  var x = this.x;
  var y = this.y;
  if (direction === 0) {
    x === 0 ? x = this.maze.getHeight() : x = x - 1;
  } else if (direction === 1) {
    y === 0 ? y = this.maze.getWidth() : y = y - 1;
  } else if (direction === 2) {
    x === this.maze.getHeight() ? x = 0 : x = x + 1;
  } else if (direction === 3) {
    y === this.maze.getWidth() ? y = 0 : y = y + 1;
  }
  this.maze.addEdge(this.x, this.y, x, y);
};

Cell.prototype.getPath = function(x,y) {
  // TODO: Benchmark, see if it's too slow when ran a lot
  var path = maze.getPath(this.x, this.y, x, y);
  return path;
}

Cell.prototype.getPathToUnknown = function() {
  var path = maze.getPathToUnknown(this.x, this.y);
  return path;
}

// Turn F,R,L,B
Cell.prototype.turn = function(dir) {
  this.dir += Cell.dirTable[dir];
  this.dir %= 4;
}

// Move n steps
Cell.prototype.move = function(n) {
  if (this.dir === 0) {
    this.y -= n;
  } else if (this.dir === 1) {
    this.x += n;
  } else if (this.dir === 2) {
    this.y += n;
  } else if (this.dir === 3) {
    this.x -= n;
  }
  this.maze.setExplored(this.x, this.y);
}

Cell.prototype.getData = function() {
  return [this.x, this.y, this.dir];
};


// Exports for node.js
if (typeof window === 'undefined') {
  exports.Maze = Maze;
  exports.Cell = Cell;
}