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
// This is because the real mazeedges need to be inside the data structure
// and we can start anywhere in the maze
Maze = function(x, y) {
  x = Math.floor(x);
  y = Math.floor(y/2)
  this.maze = new Array(x);
  for (var i = 0; i < x; i++) {
    this.maze[i] = new Array(y);
    for (var j = 0; j < y; j++) {
      this.maze[i][j] = 0;
    }
  }
};

// Use on the string from the JSON
Maze.prototype.changeMaze = function(maze) {
    this.maze = JSON.parse(maze);
};

Maze.prototype.getData = function() {
  return JSON.stringify(this.maze);
};

Maze.prototype.getWidth = function() {
  return this.maze.length;
}

Maze.prototype.getHeight = function() {
  return this.maze[0].length * 2;
}

// Cells are x, y tuples
Maze.prototype.setExplored = function(x, y) {
  if ((x + y) & 1) { // If it's odd
    if (x == 0) {
      x = this.getWidth();
    }
    x = Math.floor(x-1);
    y = Math.floor(y/2)
    this.maze[x][y] |= 1<<9;
  } else {
    x = Math.floor(x);
    y = Math.floor(y/2);
    this.maze[x][y] |= 1<<8;
  }
};

// Helper function for addWall/addConnect
// Only add if adjacent
Maze.prototype._add = function(string, cell_a, cell_b) {
  var x0 = cell_a[0];
  var y0 = cell_a[1];
  var x1 = cell_b[0];
  var y1 = cell_b[1];
  if (Math.abs(x1-x0) + Math.abs(y1 - y0) === 1) { // Manhattan distance is 1
    if ((x0 + y0) & 1) { // Swap for ease of use
      var temp = x0;
      x0 = x1;
      x1 = temp;
      temp = y0;
      y0 = y1;
      y1 = temp;
    }
    var shift;
    if (y1 < y0) { // North
      shift = 3;
    } else if (x1 < x0) { // West
      shift = 2;
    } else if (y1 > y0) { // South
      shift = 1;
    } else if (x1 > x0) { // East
      shift = 0;
    }
    var x = Math.floor(x0);
    var y = Math.floor(y0/2);
    this.maze[x][y] |= 1<<(shift+4); // The wall is no longer unknown
    if (string === 'wall') {
      this.maze[x][y] |= 1<<shift;
    } else {
      this.maze[x][y] &= ~(1<<shift);
    }
  }
};

Maze.prototype.isWall = function(cell_a, cell_b) {
  var x0 = cell_a[0];
  var y0 = cell_a[1];
  var x1 = cell_b[0];
  var y1 = cell_b[1];
  if (Math.abs(x1-x0) + Math.abs(y1 - y0) === 1) { // Manhattan distance is 1
    if ((x0 + y0) & 1) { // Swap for ease of use
      var temp = x0;
      x0 = x1;
      x1 = temp;
      temp = y0;
      y0 = y1;
      y1 = temp;
    }
    var shift;
    if (y1 < y0) { // North
      shift = 3;
    } else if (x1 < x0) { // West
      shift = 2;
    } else if (y1 > y0) { // South
      shift = 1;
    } else if (x1 > x0) { // East
      shift = 0;
    }
    var x = Math.floor(x0);
    var y = Math.floor(y0/2);
    return this.maze[x][y] & (1<<shift);
  }
};

Maze.prototype.addWall = function(cell_a, cell_b) {
  this._add('wall', cell_a, cell_b);
};

Maze.prototype.addConnect = function(cell_a, cell_b) {
  this._add('con', cell_a, cell_b);
};

Maze.prototype.getPath = function(cell_a, cell_b) {
  // Do maze finding algorithm here
};

Maze.prototype.getPathToUnknown = function(cell) {
  // Probably do fill algorithm to find nearest unknown
  // Either getPath to an unknown, or do travelling salesman
};

Maze.prototype.isExplored = function(x, y) {
  if ((x + y) & 1) {
    if (x == 0) {
      x = this.getWidth();
    }
    x = Math.floor(x-1);
    y = Math.floor(y/2);
    if (this.maze[x][y] & (1<<9)) {
      return true;
    }
  } else {
    x = Math.floor(x);
    y = Math.floor(y/2);
    if (this.maze[x][y] & (1<<8)) {
      return true;
    }
  }
  return false;
};

// Bounding box for maze
// Returns [[x, y], [x,y]]
Maze.prototype.getCorners = function() {
  // TODO: Benchmark to see if it's too inefficient
  var x0 = this._checkSide('x0');
  var x1 = this._checkSide('x1');
  var y0 = this._checkSide('y0');
  var y1 = this._checkSide('y1');
  return [[x0, y0], [x1, y1]];
};

// Iterates through maze from each side to find first explored cell
Maze.prototype._checkSide = function(str) {
  // debugger;
  if (str === 'x0') {
    for (var i = 0; i < this.getWidth(); i++) {
      for (var j = 0; j < this.getHeight(); j++) {
        if (this.isExplored(i,j)) {
          return i;
        }
      }
    }
  } else if (str === 'x1') {
    for (var i = this.getWidth() - 1; i >= 0; i--) {
      for (var j = 0; j < this.getHeight(); j++) {
        if (this.isExplored(i,j)) {
          return i;
        }
      }
    }
  } else if (str === 'y0') {
    for (var j = 0; j < this.getHeight(); j++) {
      for (var i = 0; i < this.getWidth(); i++) {
        if (this.isExplored(i,j)) {
          return j;
        }
      }
    }
  } else if (str === 'y1') {
    for (var j = this.getHeight() - 1; j >= 0; j--) {
      for (var i = 0; i < this.getWidth(); i++) {
        if (this.isExplored(i,j)) {
          return j;
        }
      }
    }
  }
};




// This is the current cell
// Direction must be N, S, E, or W
Cell = function(x, y, dir, maze) {
  if (maze != undefined) {
    maze.setExplored(x, y);
  }
  this.x = x;
  this.y = y;
  this.dirLetter = dir;
  this.dir = Cell.dirTable[dir];
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
  F:0,
  L:1,
  B:2,
  R:3,
};

// Direction is F, R, L, or B
Cell.prototype.addWall = function(dir, maze) {
  var direction = (Cell.dirTable[dir] + this.dir) % 4;
  var x = this.x;
  var y = this.y;
  if (direction === 0) {
    y === 0 ? y = maze.getHeight() : y = y - 1;
  } else if (direction === 1) {
    x === 0 ? x = maze.getWidth() : x = x - 1;
  } else if (direction === 2) {
    y === maze.getHeight() ? y = 0 : y = y + 1;
  } else if (direction === 3) {
    x === maze.getWidth() ? x = 0 : x = x + 1;
  }
  maze.addWall([this.x, this.y], [x,y]);
};

Cell.prototype.addConnect = function(dir, maze) {
  var direction = (Cell.dirTable[dir] + this.dir) % 4;
  var x = this.x;
  var y = this.y;
  if (direction === 0) {
    y === 0 ? y = maze.getHeight() : y = y - 1;
  } else if (direction === 1) {
    x === 0 ? x = maze.getWidth() : x = x - 1;
  } else if (direction === 2) {
    y === maze.getHeight() ? y = 0 : y = y + 1;
  } else if (direction === 3) {
    x === maze.getWidth() ? x = 0 : x = x + 1;
  }
  maze.addConnect([this.x, this.y], [x,y]);
};

// Turn dir, then move x steps
Cell.prototype.move = function(dir, x) {
  // TODO: Implement me!
}

Cell.prototype.getData = function(dir) {
  return [this.x, this.y, this.dirLetter];
};


// Exports for node.js
if (typeof window === 'undefined') {
  exports.Maze = Maze;
  exports.Cell = Cell;
}