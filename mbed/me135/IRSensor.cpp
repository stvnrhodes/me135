#include "IRSensor.h"

namespace me135 {
static const int kReadTime = 10000; // in us;
IRSensor::IRSensor(PinName ain) : ain_(ain){
  average_ = 0;
  ticker_.attach_us(this, &IRSensor::get_, kReadTime);
}

float IRSensor::read(void) {
  float x = average_;
  return 14.592*x*x - 28.198*x + 15.939; // Best-fit line by experimentation
}

void IRSensor::get_(void) {
  average_ = average_*0.8 + ain_*0.2;
}
}
