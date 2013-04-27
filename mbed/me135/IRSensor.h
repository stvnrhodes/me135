#ifndef _IR_SENSOR_
#define _IR_SENSOR_
#include "mbed.h"

namespace me135 {
/**
 * Controls one side of the drivetrain
 */
class IRSensor {
 public:
  /**
   * Constructor
   *
   * @param ain, Analog input for the sensor
   */
  IRSensor(PinName ain);

  /**
   * Gets the distance in inches
   *
   * @returns distance
   */
  float read(void);

  /** A shorthand for read() */
  operator float() {
      return read();
  }

 private:
  static const int kReadTime = 10000; // in us;
  void get_(void);
  AnalogIn ain_;
  volatile float average_;
  Ticker ticker_;
};

}
#endif // _IR_SENSOR_