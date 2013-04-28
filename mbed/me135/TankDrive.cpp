#include "TankDrive.h"

namespace me135{

static const float kPDistConstant = 1;
static const float kProportionalConstant = 1;
static const float kOpenLoopConstant = 1;
static const float kIntegralConstant = 1;
static const float kClicksPerInch = 10;
static const float kUsPerS = 1000000;
static const float kSpeedLoopTime = 25000; // in us
static const uint32_t kDistLoopTime = 50; // in ms

// TODO: Find a cleaner way of doing this
typedef struct {
  TankDrive *tank;
  float dist;
  Mutex *mutex;
  void (*fn)(void);
  Directions dir;
} TankInfo;

void TankDrive_runTankDist(const void *args){
  TankInfo *tank_info = (TankInfo *) args;
  TankDrive *tank = tank_info->tank;
  Mutex *mutex = tank_info->mutex;
  int final = (int) kClicksPerInch * tank_info->dist;
  QEI *left = tank->left_enc_;
  QEI *right = tank->right_enc_;
  void (*callback)(void) = tank_info->fn;

  left->reset(0);
  right->reset(0);
  switch (tank_info->dir) {
  case FWD:
    for (int dist = 0; dist < final; dist = min(left->getPulses(0), right->getPulses(0))) {
      int error = final - dist;
      // Only proportional control for now
      tank->forward(kPDistConstant * error);
      Thread::wait(kDistLoopTime);
    }
    break;
  case LEFT:
    for (int dist = 0; dist < final; dist = min(-left->getPulses(0), right->getPulses(0))) {
      int error = final - dist;
      // Only proportional control for now
      tank->left(kPDistConstant * error);
      Thread::wait(kDistLoopTime);
    }
    break;
  case RIGHT:
    for (int dist = 0; dist < final; dist = min(left->getPulses(0), -right->getPulses(0))) {
      int error = final - dist;
      // Only proportional control for now
      tank->right(kPDistConstant * error);
      Thread::wait(kDistLoopTime);
    }
    break;
  default:
    // Invalid, do nothing
    break;
  }
  if (callback != NULL) {
    callback();
  }
  mutex->unlock();
}


TankDrive::TankDrive(DriveTrain *left, DriveTrain *right, QEI *left_enc,
    QEI *right_enc) {
  left_ = left;
  right_ = right;
  left_enc_ = left_enc;
  right_enc_ = right_enc;
  left_target_speed_ = 0;
  right_target_speed_ = 0;
  speed_control_.attach_us(this, &TankDrive::speed_loop_, kSpeedLoopTime);
}

void TankDrive::forward(float speed) {
  left_target_speed_ = (kClicksPerInch * speed);
  right_target_speed_ = (kClicksPerInch * speed);
}

void TankDrive::left(float speed) {
  left_target_speed_ = -(kClicksPerInch * speed);
  right_target_speed_ = (kClicksPerInch * speed);
}

void TankDrive::right(float speed) {
  left_target_speed_ = -(kClicksPerInch * speed);
  right_target_speed_ = (kClicksPerInch * speed);
}

void TankDrive::backward(float speed) {
  left_target_speed_ = -(kClicksPerInch * speed);
  right_target_speed_ = -(kClicksPerInch * speed);
}

float TankDrive::getLeftSpeed(void) {
  return kUsPerS / left_enc_->getPeriod();
}

float TankDrive::getRightSpeed(void) {
  return kUsPerS / right_enc_->getPeriod();
}

void TankDrive::goDist (float dist, void (*fn)(void), Directions dir) {
  if (dist_mutex_.trylock()) {
    TankInfo *tankInfo = (TankInfo*) malloc(sizeof(TankInfo));
    tankInfo->tank = this;
    tankInfo->dist = dist;
    tankInfo->mutex = &dist_mutex_;
    tankInfo->fn = fn;
    tankInfo->dir = dir;
    Thread(TankDrive_runTankDist, (void *) tankInfo, osPriorityHigh);
  }
}

void TankDrive::speed_loop_(void) {
  maintain_speed_(right_target_speed_, right_, right_enc_);
  maintain_speed_(left_target_speed_, left_, left_enc_);
}

// PD Control
void TankDrive::maintain_speed_(float target_speed, DriveTrain *drive, QEI *enc) {
  float speed = kUsPerS / enc->getPeriod();
  // DUMB BANG BANG
  speed > target_speed ? *drive = 0 : *drive = 1;

  // Actual code?
  // float error = target_speed - speed;
  // *drive = kProportionalConstant * error + kOpenLoopConstant * target_speed;
}

}
