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
   * @param motor_fwd Motor forward pin, must be PWM
   * @param motor_fwd Motor forward pin, must be PWM
   */
  Shooter(PinName servo, PinName motor_fwd, PinName motor_rev);

  /** For manual adjustment
   *
   */
  int adjust(bool up);

  float up(void) {
    fwd_ = fwd_.read() + 0.05;
    return fwd_;
  }
  float down(void) {
    fwd_ = fwd_ - 0.05;
    return fwd_.read();
  }

  /**
   * Spins up motor for shooting
   */
  void spinup(void);

  /**
   * Stops spinning the shooting motor
   */
  void spindown(void);

  /**
   * Spins up motor (if not spinning) and fires shooter,
   * nonblocking but uses timers
   */
  void fire(void);

  /**
   * Checks if the shooter is already in the process of firing
   *
   * @return bool True if the shooter is firing
   */
  bool isFiring(void);

  /**
   * True if shot has been fired, false for subsequent calls
   */
  bool hasFired(void);

  /**
   * Attaches a function to be called whenever the shooter fires
   */
  void attach(void (*func)(void));

 private:
  void on_(void);
  void off_(void);
  void recock_(void);
  void engage_(void);
  void done_(void);
  DigitalOut servo_;
  PwmOut fwd_;
  PwmOut rev_;
  Ticker servo_ticker_;
  Timeout servo_timeout_;
  Timeout firing_timeout_;
  volatile int servo_pos_;
  volatile bool firing_;
  volatile bool just_fired_;
  void (*func_)(void);
  volatile bool has_fired_;
};

}
#endif // _SHOOTER_H_
