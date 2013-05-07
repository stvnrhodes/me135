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
#include "Sonar.h"
#include "QEI.h"

const float kIdealWallDist = 4;
const float kFrontWallDist = 4;
const float kWallDist = 8;
const float kGrabbingDistance = 3;
const float kCloseEnoughToMiddle = 0.5;
const float kStraightenSameSide = 0.1; // Minimum difference that we still straighten
const int kDistControlLoopTime = 50000; // in us
const int kSpeedControlLoopTime = 50000; // in us
const float kCheckClawTime = 0.2;
const float kDelayClawTime = 2;
const int kSendDataTime = 200000; // in us, time between sending graph data
const int kQuarterCircle = 390;
const int kUsPerS = 1000000;
const int kSpeedScaling = 1;
const int kSpeedI = 0;
const int kSpeedOL = 60;
const int kSpeedP = 60;
const float kStraighten = 3;
const float kStraightenD = 30;
const int kDistPNumerator = 0;//1000;
const int kDistPDenominator = 10000;
const int kDistOL = 20;
const int kMaxITerm = 1000;
const int kMinITerm = -1000;
const int kClicksPerInch = 42;
const float kMaxPrescaledSpeed = 3000;
const float kSquareSize = 14; // in inches
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

template <typename T>
inline T abs(T x) {
  return x > 0 ? x : -x;
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
