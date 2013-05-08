// Shared code with browser
var Maze = require('./public/maze.verbose.js').Maze;
var Cell = require('./public/maze.verbose.js').Cell;


var CarState = function() {
  this.maze = new Maze()
  this.cell = new Cell(0,0,'N',this.maze)
  this.mode = 'manual';
  this.color_state = { id: 'color', ally: '#000000', enemy: '#000000' };
  this.num_shots = 0;
  this.claw_pos = 0;
  this.nav = null;
  this.grabbed = 0;
  this.shoot_mode = false;
  this.claw_ir = 0;
}

CarState.prototype.explore_dir = function() {
  var dir = this.cell.getPathToUnknown();
  console.log(dir);
  if (!dir) {
    dir = this.cell.getPath(0,0);
  }
  return dir;
}

CarState.prototype.reset_maze = function() {
  this.maze = new Maze()
  this.cell = new Cell(0,0,'N',this.maze)
}

CarState.modes = ['explore', 'manual', 'navigate']


exports.CarState = CarState
