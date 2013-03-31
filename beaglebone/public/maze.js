// Maze data only stores every other cell
//  Here's a 6x6 maze, XY.  We organize it as 3Wx6H.
//  00  20  40
//    11  31  51
//  02  22  42
//    13  33  53
//  04  35  44
//    15  35  55
// Conveniently, only cells that add up to even numbers are present.


// Make a maze of height x and width y.
// This should be at least twice as big as the actual maze
// This is because the real maze edges need to be inside the data structure
// and we can start anywhere in the maze
Maze = function(m) {
  this.node_list = [[new Node()]];
  this.xOffset = 0;
  this.yOffset = 0;
  if (arguments.length == 1) {
    this._parseAndAdd(m);
  }
};

Maze.prototype._parseAndAdd = function(maze_data) {
  // for (i = 0; i < maze_data.maze.length; i++) {
  //   for (j = 0; j < maze_data.maze[i].length; j++) {
  //     this._node(i-maze_data.x0,j-maze_data.y0);
  //   }
  // }
  for (i = 0; i < maze_data.maze.length; i++) {
    for (j = 0; j < maze_data.maze[i].length; j++) {
      this._node(i+maze_data.x0,j+maze_data.y0)._parseAndAdd(maze_data.maze[i][j], this);
    }
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
  var node = this.node_list[x+this.xOffset][y+this.yOffset];
  if (!node.loc) {
    node.loc = [x,y];
  }
  return node;
};


Maze.prototype.getData = function() {
  var row;
  var maze = [];
  var corner = this.getCorners();
  var x0 = corner[0][0];
  var y0 = corner[0][1];
  var x1 = corner[1][0];
  var y1 = corner[1][1];
  for (var i = x0; i < x1; i++) {
    row = [];
    for (var j = y0; j < y1; j++) {
      row.push(this._node(i,j).getData());
    }
    maze.push(row);
  }
  return {maze:maze, x0:x0, y0:y0};
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
      if (!path[next_node.loc]) {
        path[next_node.loc] = node;
        fringe.push(next_node);
      }
    }
    node = fringe.shift();
    if (!node) { // node is undefined if we empty the fringe
      return;
    }
  }
  var answer = [];
  while (node !== start){
    answer.unshift(node.loc);
    node = path[node.loc];
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
Node = function() {
  this.explored = false;
  this.edges = [];
  this.walls = [];
  // We leave this.loc unset
  // This is so we can set it dynamically
};

Node.prototype._parseAndAdd = function(node_data, maze) {
  this.explored = node_data.ex;
  for (var i = 0; i < node_data.e.length; i++) {
    var xy = node_data.e[i];
    this.edges.push(maze._node(xy[0], xy[1]));
  }
  for (var i = 0; i < node_data.w.length; i++) {
    var xy = node_data.w[i];
    this.walls.push(maze._node(xy[0], xy[1]));
  }
};

Node.prototype.getData = function() {
  var node_data = {};
  node_data.e = [];
  for (var i = 0; i <  this.edges.length; i++) {
     node_data.e.push(this.edges[i].loc);
  }
  node_data.w = [];
  for (var i = 0; i <  this.walls.length; i++) {
     node_data.w.push(this.walls[i].loc);
  }
  node_data.ex = this.explored;
  return node_data;
};

Node.prototype.getEdges = function() {
  return this.edges;
};

Node.prototype.getWalls = function() {
  return thus.walls;
};

// Currently, the node will happily add a wall and an edge to another node
Node.prototype.addWall = function(node) {
  this.walls.push(node);
  for (var i = 0; i < this.edges.length; i++) {
    if (node === this.edges[i]) {
      // Remove node from edges
      this.edges.splice(i, 1);
    }
  };
};

Node.prototype.addEdge = function(node) {
  this.edges.push(node);
  for (var i = 0; i < this.walls.length; i++) {
    if (node === this.walls[i]) {
      // Remove node from walls
      this.walls.splice(i, 1);
    }
  };
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
Cell.dirTable = {N:0,W:1,S:2,E:3,
                 n:0,w:1,s:2,e:3,
                 F:0,L:1,B:2,R:3,
                 f:0,l:1,b:2,r:3,};

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
    this.x -= n;
  } else if (this.dir === 1) {
    this.y -= n;
  } else if (this.dir === 2) {
    this.x += n;
  } else if (this.dir === 3) {
    this.y += n;
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