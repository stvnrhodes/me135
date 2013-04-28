#ifndef _DRIVETRAIN_H_
#define _DRIVETRAIN_H_
#include "mbed.h"
#include "me135.h"

namespace me135 {
/**
 * Controls one side of the drivetrain
 */
class DriveTrain {
 public:
  /**
   * Constructor
   *
   * @param fwd Motor Forward pin, must be PWM
   * @param rev Motor reverse pin, must be PWM
   */
  DriveTrain(PinName fwd, PinName rev);

  /**
   * Runs side at the given rate, between -1 and 1
   *
   * @param rate Rate to run, 0 is coast
   */
  void write(float rate);

  /**
   * Runs the motor against itself, braking it
   */
  void brake(float rate = 1);

  /**
   * Gets the rate we're running at
   *
   * @returns rate, 0 if coasting or braking
   */
  float read(void);

  /** A shorthand for write() */
  DriveTrain& operator= (float value) {
      write(value);
      return *this;
  }
  DriveTrain& operator= (DriveTrain& rhs) {
      write(rhs.read());
      return *this;
  }

  /** A shorthand for read() */
  operator float() {
      return read();
  }

 private:
  PwmOut fwd_;
  PwmOut rev_;
  float rate_;
};

}
#endif // _DRIVETRAIN_H_
