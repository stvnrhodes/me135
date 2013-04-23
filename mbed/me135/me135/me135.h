/*
 * me135.h
 *
 *  Created on: Apr 16, 2013
 *      Author: stvn
 */

#ifndef ME135_H_
#define ME135_H_

#include "Claw.h"
#include "DriveTrain.h"
#include "BeagleBone.h"
#include "Shooter.h"
#include "IRSensor.h"
#include "QEI.h"

const int FAKE_MAZE_ROWS = 4;
const int FAKE_MAZE_COLUMNS = 4;
const bool fake_maze[4][4][4] = {{{1,1,0,0},{1,0,1,0},{1,0,0,0},{1,0,0,1}},
                                 {{0,1,1,1},{1,1,0,1},{0,1,1,1},{0,1,0,1}},
                                 {{1,1,0,1},{0,1,1,0},{1,0,0,0},{0,0,1,1}},
                                 {{0,1,1,0},{1,0,1,0},{0,0,1,0},{1,0,1,1}}};

// const int FAKE_MAZE_ROWS = 2;
// const int FAKE_MAZE_COLUMNS = 2;
// const bool fake_maze[2][2][4] = {{{1,1,0,0},{1,0,1,1}},
//                                 {{0,1a,1,0},{1,0,1,1}}};

typedef enum {
  WAITING,
  MOVE_FORWARD,
  TURN_LEFT,
  TURN_RIGHT,
  ERROR
} Modes;

typedef enum {
  UP=0,
  FWD=0,
  LEFT=1,
  DOWN=2,
  BACK=2,
  RIGHT=3
} Directions;
// real_direction[orientation][direction]
const Directions real_direction[4][4] = {{UP, LEFT, DOWN, RIGHT},
                                         {LEFT, DOWN, RIGHT, UP},
                                         {DOWN, RIGHT, UP, LEFT},
                                         {RIGHT, UP, LEFT, DOWN}};

#endif /* ME135_H_ */
