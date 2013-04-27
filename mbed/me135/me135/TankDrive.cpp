#include "TankDrive.h"

namespace me135{

TankDrive::TankDrive(DriveTrain *left, DriveTrain *right, QEI *left_enc,
    QEI *right_enc) {
  left_ = left;
  right_ = right;
  left_enc_ = left_enc;
  right_enc_ = right_enc;
  target_speed_ = 0;
  speed_control_.attach_ms(this, &TankDrive::speed_loop_, kSpeedLoopTime);
}

void TankDrive::forward(float speed) {
  target_speed_ = (int) (kClicksPerInt * speed);
}

void TankDrive::speed_loop_(void) {
  maintain_speed_(right_target_speed_, right_, right_enc_);
  maintain_speed_(left_target_speed_, left_, left_enc_);
}

void TankDrive::maintain_speed_(int speed, DriveTrain *drive, QEI *enc) {
  int period = enc.getPeriod();

}

}