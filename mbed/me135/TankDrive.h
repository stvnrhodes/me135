#ifndef _TANKDRIVE_H_
#define _TANKDRIVE_H_
#include "mbed.h"
#include "DriveTrain.h"
#include "QEI.h"

namespace me135 {
/**
 * Controls one side of the TankDrive
 */
class TankDrive {
 public:
  /**
   * Constructor
   *
   * @param left Left DriveTrain
   * @param right Right DriveTrain
   */
  TankDrive(DriveTrain *left, DriveTrain *right, QEI *left_enc, QEI *right_enc);

  /**
   * Speed control
   *
   * @param rate Rate to run in inches/s
   */
  void forward(float speed);
  void backward(float speed);
  void left(float speed);
  void right(float speed);
  void stop(void);

  /**
   * Speed reading
   *
   * @return Speed in inches/s
   */
  float getLeftSpeed(void);
  float getRightSpeed(void);

  /**
   * Distance control
   * @param dist Distance to go in inches
   * @param fn A callback function
   */
  void forwardDist(float dist, void (*fn)(void));
  void backwardDist(float dist, void (*fn)(void));

  /**
   * Turning control
   * @param deg Amount to turn in degrees
   * @param fn A callback function
   */
  void turn(float deg, void(*fn)(void));

 private:
  void speed_loop_(void);
  void maintain_speed_(float target_speed, DriveTrain *drive, QEI *enc);
  static const float kProportionalConstant = 1;
  static const float kOpenLoopConstant = 1;
  static const float kIntegralConstant = 1;
  static const float kClicksPerInch = 10;
  static const float kUsPerS = 1000000;
  static const float kSpeedLoopTime = 25000; // in us
  DriveTrain *left_, *right_;
  QEI *left_enc_, *right_enc_;
  Ticker speed_control_;
  volatile float right_target_speed_;
  volatile float left_target_speed_;
  void (*callback_)(void);
};

}
#endif // _TANKDRIVE_H_
