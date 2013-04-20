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

const int fake_maze_rows = 4;
const int fake_maze_columns = 4;
const bool fake_maze[4][4][4] = {{{1,0,0,1},{1,0,1,0},{1,0,0,0},{1,1,0,0}},
                              {{0,1,1,0},{1,1,0,1},{0,1,1,1},{0,0,0,1}},
                              {{1,1,0,1},{0,0,1,1},{1,0,0,0},{0,1,1,0}},
                              {{0,0,1,1},{1,0,1,0},{0,0,1,0},{1,1,1,0}}};
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
	RIGHT=1,
	DOWN=2,
	BACK=2,
	LEFT=3
} Directions;
// real_direction[orientation][direction]
const Directions real_direction[4][4] = {{UP, RIGHT, DOWN, LEFT},
                                       {RIGHT, DOWN, LEFT, UP},
                                       {DOWN, LEFT, UP, RIGHT},
                                       {LEFT, UP, RIGHT, DOWN}};

#endif /* ME135_H_ */
