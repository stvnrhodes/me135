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


const int kSpeedControlLoopTime = 50000; // in us
const int kSendDataTime = 200; // in ms, time between sending data for graphs
const int kQuarterCircle = 90;
const int kHalfCircle = 180;
const int kUsPerS = 1000000;
const int kSpeedScaling = 1000;
const int kSpeedI = 0;
const int kSpeedOL = 1;
const int kSpeedP = 1;
const int kDistP = 1;
const int kClicksPerInch = 10;
const float kMaxPrescaledSpeed = 1000;
const float kSquareSize = 12; // in inches
const int kMaxMsgSize = 10;
const int kBufferSize = 256;
const float kMaxSpeed = 99.0f;
const float kMaxClawPos = 99.0f;

typedef enum {
  UP=0,
  FWD=0,
  LEFT=1,
  DOWN=2,
  BACK=2,
  RIGHT=3,
  STOP=4
} Directions;

typedef enum {
  IDLE,
  MOVING
} Modes;

template <typename T>
inline T constrain(T x, T min, T max){
  return x > max ? max : (x < min ? min : x);
}

template <typename T>
inline T map(T n, T a, T b, T x, T y){
  return x + (n-a)*(y-x)/(b-a);
}

template <typename T>
inline T max(T x, T y) {
  return x > y ? x : y;
}

template <typename T>
inline T min(T x, T y) {
  return x < y ? x : y;
}

inline Directions charToDirection(char c) {
  if (c == 'f') {
    return FWD;
  } else if (c == 'b') {
    return BACK;
  } else if (c == 'r') {
    return RIGHT;
  } else if (c == 'l') {
    return LEFT;
  } else {
    return STOP;
  }
}

#endif /* ME135_H_ */
