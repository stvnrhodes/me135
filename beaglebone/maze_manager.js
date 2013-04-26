// Shared code with browser
var Maze = require('./public/maze.verbose.js').Maze;
var Cell = require('./public/maze.verbose.js').Cell;
var EventEmitter = require('events').EventEmitter;

var MazeManager = function() {
  this.maze = new Maze()
  this.cell = new Cell(0,0,'N',this.maze)
}

MazeManager.prototype = new EventEmitter();

// Meant to be called from the uart event
MazeManager.prototype.update = function(data) {
  var parsed = {};
  try {
    parsed = JSON.parse(data);
  } catch(e) {
    // log.warn("UART is not JSON: " + e)
  }
  if (parsed.id === 'maze_walls') {
    // log.info(JSON.stringify(parsed));

    if (parsed.left) { this.cell.addWall('L'); }
    else { this.cell.addConnect('L'); }
    if (parsed.center) { this.cell.addWall('F'); }
    else { this.cell.addConnect('F'); }
    if (parsed.right) { this.cell.addWall('R'); }
    else { this.cell.addConnect('R'); }
    this.emit('update', {maze:this.maze, cell:this.cell});
    // Let's explore the maze!
    var dir = this.cell.getPathToUnknown()
    // Fixing reverse into two steps
    if (dir === 'b') {
      dir = 'l';
    }
    if (dir) {
      this.emit('action', dir)
    }
  }
}


exports.MazeManager = MazeManager
