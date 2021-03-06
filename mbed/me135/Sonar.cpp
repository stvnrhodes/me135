#include "Sonar.h"

namespace me135 {
Sonar::Sonar(PinName trig, PinName echo) : trig_(trig), echo_(echo) {
  average_ = 5 / kSonicToIn;
  timer_.start();
  ticker_.attach_us(this, &Sonar::get_, kReadTime);
  echo_.rise(this, &Sonar::on_rise_);
  echo_.fall(this, &Sonar::on_fall_);
}

float Sonar::read(void) {
  float x = average_;
  return x * kSonicToIn; // Looking at speed of sound
}

void Sonar::on_rise_(void) {
  timer_.start();
}

void Sonar::on_fall_(void) {
  average_ = average_*0.2 + timer_.read_us()*0.8;
  get_();
}

void Sonar::get_(void) {
  // Make sure trig is down
  trig_ = 0;
  wait_us(1);
  trig_ = 1;
  wait_us(kTrigTime);
  trig_ = 0;
  ticker_.attach_us(this, &Sonar::get_, kReadTime);
}
}
