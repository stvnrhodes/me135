#include "Shooter.h"

namespace me135 {
static const int kFiringTime = 200000; // in us
static const int kRecockingTime = 200000; // in us
static const int kServoTime = 20000; // in us
static const int kServoFiring = 1425; // in us
static const int kServoIdle = 1635; // in us

Shooter::Shooter(PinName servo, PinName motor): servo_(servo), motor_(motor) {
  motor_ = 0;
  servo_pos_ = kServoIdle;
  servo_ticker_.attach_us(this, &Shooter::on_, kServoTime);
}

int Shooter::adjust(bool up) {
  if (up) {
    servo_pos_ += 5;
  } else {
    servo_pos_ -= 5;
  }
  return servo_pos_;
}

void Shooter::spinup(void) {
  motor_ = 1;
}

void Shooter::spindown(void){
  motor_ = 0;
}

void Shooter::fire(void) {
  if (!firing_) {
    firing_ = true;
    servo_pos_ = kServoFiring;
    firing_timeout_.attach_us(this, &Shooter::recock_, kFiringTime);
  }
}

bool Shooter::isFiring(void) {
  return firing_;
}

void Shooter::on_(void) {
  servo_ = 1;
  servo_timeout_.attach_us(this, &Shooter::off_, servo_pos_);
}

void Shooter::off_(void) {
  servo_ = 0;
}

void Shooter::recock_(void) {
  servo_pos_ = kServoIdle;
  firing_timeout_.attach_us(this, &Shooter::done_, kRecockingTime);
}

void Shooter::done_(void) {
  firing_ = false;
}
}
