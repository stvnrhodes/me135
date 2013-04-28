#ifndef _CLAW_H_
#define _CLAW_H_
#include "mbed.h"
#include "me135.h"

namespace me135 {
/**
 * Controls a claw for grabbing
 */
class Claw {
 public:
  /**
   * Constructor
   *
   * @param servo The pin for the servo, any GPIO
   */
  Claw(PinName servo);

  /**
   * Moves the claw to a position between 0 and 1
   *
   * @param pos The position we're moving to
   */
  void write(const float pos);

   /*
    * Gets the current position of the claw
    *
    * @returns position, between 0 and 1
    */
  float read(void);

  /** A shorthand for write() */
  Claw& operator= (float value) {
      write(value);
      return *this;
  }
  Claw& operator= (Claw& rhs) {
      write(rhs.read());
      return *this;
  }

  /** A shorthand for read() */
  operator float() {
      return read();
  }
 private:
  static const float kMinClawPos = 0;
  static const float kMaxClawPos = 1;
  static const int kServoTime = 20000;
  static const int kServoMin = 1650;
  static const int kServoMax = 2350;
  DigitalOut pin_;
  float pos_;
  volatile unsigned int cycle_time_;
  void on_(void);
  void off_(void);
  Ticker ticker_;
  Timeout timeout_;
};
}
#endif // _CLAW_H_
