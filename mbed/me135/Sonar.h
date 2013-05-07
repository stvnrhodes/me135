#ifndef _SONAR_
#define _SONAR_
#include "mbed.h"

namespace me135 {
/**
 * Controls one side of the drivetrain
 */
class Sonar {
 public:
  /**
   * Constructor
   *
   * @param trig, Triggers the sonar
   * @param echo Goes high when we see the sonar
   */
  Sonar(PinName trig, PinName echo);

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
  void get_(void);
  void on_rise_(void);
  void on_fall_(void);
  static const int kReadTime = 500000; // in us
  static const int kTrigTime = 5; // in us
  static const float kSonicToIn = 1.0f / 148.0f;
  DigitalOut trig_;
  InterruptIn echo_;
  volatile float average_;
  Timer timer_;
  Timeout ticker_;
};

}
#endif // _SONAR_
