#include "Shooter.h"

namespace me135 {
static const int kFiringTime = 200000; // in us
static const int kRecockingTime = 200000; // in us
static const int kServoTime = 20000; // in us
static const int kServoFiring = 1425; // in us
static const int kServoIdle = 1635; // in us
static const int kSpinupTime = 1000000; // in us
static const int kSpindownTime = 1000000; // in us

Shooter::Shooter(PinName servo, PinName motor_fwd, PinName motor_rev):
    servo_(servo), fwd_(motor_fwd), rev_(motor_rev) {
  fwd_ = 0;
  rev_ = 0;
  servo_pos_ = kServoIdle;
  func_ = NULL;
  firing_ = false;
  just_fired_ = true;
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
  fwd_ = 1;
}

void Shooter::spindown(void) {
  fwd_ = 0;
  just_fired_ = false;
}

bool Shooter::hasFired(void) {
  if (has_fired_) {
    has_fired_ = false;
    return true;
  } else {
    return false;
  }
}

void Shooter::fire(void) {
  if (!firing_) {
    firing_ = true;
    if (just_fired_) {
      engage_();
    } else {
      spinup();
      firing_timeout_.attach_us(this, &Shooter::engage_, kSpinupTime);
    }
  }
}

void Shooter::engage_(void) {
  servo_pos_ = kServoFiring;
  firing_timeout_.attach_us(this, &Shooter::recock_, kFiringTime);
}

bool Shooter::isFiring(void) {
  return firing_;
}

void Shooter::attach(void (*func)(void)) {
  func_ = func;
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
  just_fired_ = true;
  firing_timeout_.attach_us(this, &Shooter::spindown, kSpindownTime);
  if (func_ != NULL) {
    func_();
  }
}
}
