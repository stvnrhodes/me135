#ifndef _SHOOTER_H_
#define _SHOOTER_H_
#include "mbed.h"

namespace me135 {

/**
 * Controls the shooter
 */
class Shooter {
 public:
  /**
   * Constructor
   *
   * @param servo Servo pin, any GPIO
   * @param motor Motor pin, must be PWM
   */
  Shooter(PinName servo, PinName motor);

  /**
   * Spins up motor for shooting
   */
  void spinup(void);

  /**
   * Stops spinning the shooting motor
   */
  void spindown(void);

  /**
   * Reloads shooter, nonblocking but uses timers
   */
  void fire(void);

  /**
   * Checks if the shooter is already in the process of firing
   *
   * @return bool True if the shooter is firing
   */
  bool isFiring(void);

 private:
  void on_(void);
  void off_(void);
  void recock_(void);
  void done_(void);
  DigitalOut servo_;
  PwmOut motor_;
  Ticker servo_ticker_;
  Timeout servo_timeout_;
  Timeout firing_timeout_;
  volatile int servo_pos_;
  volatile bool firing_;
};

}
#endif // _SHOOTER_H_