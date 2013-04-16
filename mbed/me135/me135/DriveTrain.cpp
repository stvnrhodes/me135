#include "DriveTrain.h"

namespace me135 {
template <typename T>
inline T constrain(T x, T min, T max){
  return x > max ? max : (x < min ? min : x);
}

DriveTrain::DriveTrain(PinName fwd, PinName rev) : fwd_(fwd), rev_(rev) {
  fwd_ = 0;
  rev_ = 0;
}

void DriveTrain::write(float rate) {
  rate_ = constrain<float>(rate, -1, 1);
  if (rate > 0) {
    fwd_ = rate;
    rev_ = 0;
  } else {
    fwd_ = 0;
    rev_ = rate;
  }
}

void DriveTrain::brake(float rate) {
  rate_ = constrain<float>(rate, -1, 1);
  fwd_ = rate_;
  rev_ = rate_;
  rate_ = 0;
}

float DriveTrain::read(void) {
  return rate_;
}

}
