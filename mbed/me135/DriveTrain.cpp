#include "DriveTrain.h"

namespace me135 {

DriveTrain::DriveTrain(PinName fwd, PinName rev) : fwd_(fwd), rev_(rev) {
  fwd_ = 0;
  rev_ = 0;
  rate_ = 0;
}

void DriveTrain::write(float rate) {
  rate_ = constrain<float>(rate, -1, 1);
  if (rate > 0.03) {
    fwd_ = rate;
    rev_ = 0;
  } else if (rate < -0.03) {
    fwd_ = 0;
    rev_ = -rate;
  } else {
    brake(1);
  }
}

void DriveTrain::brake(float rate) {
  rate_ = constrain<float>(rate, 0, 1);
  fwd_ = rate_;
  rev_ = rate_;
  rate_ = 0;
}

float DriveTrain::read(void) {
  return rate_;
}

}
