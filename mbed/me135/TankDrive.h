#ifndef _TANKDRIVE_H_
#define _TANKDRIVE_H_
#include "mbed.h"
#include "me135.h"
#include "QEI.h"
#include "rtos.h"

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
  void goDist(float dist, void (*fn)(void));

  /**
   * Turning control
   * @param deg Amount to turn in degrees
   * @param fn A callback function
   */
  void turn(float deg, void(*fn)(void));

  // Sloppy encapsulation, but makes doing threading easier
  // We'll keep the underscore because even though it's public,
  // it really should be private.
  QEI *left_enc_, *right_enc_;

 private:
  DriveTrain *left_, *right_;
  Mutex dist_mutex_;
  void speed_loop_(void);
  void maintain_speed_(float target_speed, DriveTrain *drive, QEI *enc);
  Ticker speed_control_;
  volatile float right_target_speed_;
  volatile float left_target_speed_;
  void (*callback_)(void);
};

}
#endif // _TANKDRIVE_H_
