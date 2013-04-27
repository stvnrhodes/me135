#include "TankDrive.h"

namespace me135{

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
