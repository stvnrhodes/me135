#include "Claw.h"
namespace me135{


Claw::Claw(PinName servo) : pin_(servo) {
  write(0.1);
  ticker_.attach_us(this, &Claw::on_, kServoTime);
}

void Claw::write(const float pos) {
  pos_ = constrain(pos, kMinClawPos, kMaxClawPos);
  cycle_time_ = (int) map<float>(pos_, kMinClawPos, kMaxClawPos,
                                       kServoMin, kServoMax);
}

float Claw::read(void) {
  return pos_;
}

void Claw::on_(void) {
  pin_ = 1;
  timeout_.attach_us(this, &Claw::off_, cycle_time_);
}

void Claw::off_(void) {
  pin_ = 0;
}
}
