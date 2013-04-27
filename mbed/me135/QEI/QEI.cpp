/**
 * @author Aaron Berk
 *
 * @section LICENSE
 *
 * Copyright (c) 2010 ARM Limited
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

#include "QEI.h"

QEI::QEI(PinName channelA, PinName channelB) :
    channelA_(channelA), channelB_(channelB) {

  pulses_ = 0;

  for (int i = 0; i < kNumOfOffsets; i++) {
    offset_[i] = 0;
  }

  //Workout what the current state is.
  int chanA = channelA_.read();
  int chanB = channelB_.read();

  //2-bit state.
  currState_ = (chanA << 1) | (chanB);
  prevState_ = currState_;

  timer_.start();

  //X4 encoding uses interrupts on      channel A,
  //and on channel B.
  channelA_.rise(this, &QEI::encode_);
  channelA_.fall(this, &QEI::encode_);
  channelB_.rise(this, &QEI::encode_);
  channelB_.fall(this, &QEI::encode_);

}

void QEI::reset(int ctr_num) {
  offset_[ctr_num] = pulses_;
}

int QEI::getCurrentState(void) {
  return currState_;
}

int QEI::getPulses(int ctr_num) {
  return pulses_ - offset_[ctr_num];
}

int QEI::getPeriod(void) {
  return period_;
}

// +-------------+
// | X4 Encoding |
// +-------------+
//
// There are four possible states for a quadrature encoder which correspond to
// 2-bit gray code.
//
// A state change is only valid if of only one bit has changed.
// A state change is invalid if both bits have changed.
//
// Clockwise Rotation ->
//
//    00 01 11 10 00
//
// <- Counter Clockwise Rotation
//
// If we observe any valid state changes going from left to right, we have
// moved one pulse clockwise [we will consider this "backward" or "negative"].
//
// If we observe any valid state changes going from right to left we have
// moved one pulse counter clockwise [we will consider this "forward" or
// "positive"].
//
// We might enter an invalid state for a number of reasons which are hard to
// predict - if this is the case, it is generally safe to ignore it, update
// the state and carry on, with the error correcting itself shortly after.
void QEI::encode_(void) {

  int chanA  = channelA_.read();
  int chanB  = channelB_.read();

  //2-bit state.
  currState_ = (chanA << 1) | (chanB);

  //Entered a new valid state.
  if (((currState_ ^ prevState_) != INVALID) && (currState_ != prevState_)) {
    //2 bit state. Right hand bit of prev XOR left hand bit of current
    //gives 0 if clockwise rotation and 1 if counter clockwise rotation.
    int change = (prevState_ & PREV_MASK) ^ ((currState_ & CURR_MASK) >> 1);
    if (change == 0) {
      change = -1;
    }
    pulses_ -= change;
    int time = timer_.read_us();
    period_ = (time - last_time_) / 2 + period_ / 2;
    last_time_ = time;
  }
  prevState_ = currState_;
}
