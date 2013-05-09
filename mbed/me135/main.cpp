#include "mbed.h"
#include "me135.h"
#define VERBOSE
#define KEY(x,y) #x ":" #y

BusOut leds(LED1, LED2, LED3, LED4);
me135::BeagleBone bone(p9, p10);
QEI left_enc(p11, p12);
QEI right_enc(p13, p14);

me135::IRSensor claw_ir(p15);
me135::IRSensor left_ir(p16);
me135::IRSensor right_ir(p17);
me135::IRSensor front_ir(p18);
me135::DriveTrain right_drive(p21, p22);
me135::DriveTrain left_drive(p24, p23);
me135::Shooter shooter(p28, p26, p25);
me135::Claw claw(p29);

volatile int g_left_target_speed = 0;
volatile int g_right_target_speed = 0;

const char *dir_to_str[] = {"fwd", "left", "back", "right", "stop"};

// We send the data back so we can have pretty graphs
void send_ir(void) {
  char buffer[256];
  int len = sprintf(buffer, "{" KEY("id","ir")
                            "," KEY("front", %f)
                            "," KEY("left",%f)
                            "," KEY("right",%f)
                            "," KEY("claw",%f) "}\n",
                            front_ir.read(),
                            left_ir.read(),
                            right_ir.read(),
                            claw_ir.read());
  bone.write(buffer, len);
}

void send_encoder(void) {
  char buffer[256];
  int len = sprintf(buffer, "{" KEY("id", "encoder")
                            "," KEY("left", %f)
                            "," KEY("right", %f) "}\n",
                            ((float)left_enc.getPulses(2)) / kClicksPerInch *
                                                     kUsPerS / kSendDataTime,
                            ((float)right_enc.getPulses(2)) / kClicksPerInch *
                                                     kUsPerS / kSendDataTime);
  left_enc.reset(2);
  right_enc.reset(2);
  bone.write(buffer, len);
}

void send_encoder_count(void) {
  char buffer[256];
  int len = sprintf(buffer, "{" KEY("id", "encoder_count")
                            "," KEY("left", %d)
                            "," KEY("right", %d) "}\n",
                            left_enc.getPulses(1), right_enc.getPulses(1));
  bone.write(buffer, len);
}

void send_walls(Directions dir) {
  char buffer[256];
  char len = sprintf(buffer, "{" KEY("id","maze_walls")
                             "," KEY("left",%d)
                             "," KEY("right",%d)
                             "," KEY("center",%d)
                             "," KEY("action","%s") "}\n",
                              left_ir < kWallDist,
                              right_ir < kWallDist,
                              front_ir < kWallDist,
                              dir_to_str[dir]);
  bone.write(buffer, len);
}

void send_claw_pos(const float claw_pos, const bool grabbed) {
  int pos = (int)(claw_pos * 99);
  char buffer[128];
  char len = sprintf(buffer, "{" KEY("id","claw")
                             "," KEY("pos",%d)
                             "," KEY("grabbed",%d) "}\n",
                             pos, grabbed);
  bone.write(buffer, len);
}

bool dist_control(const int final, const Directions dir) {
  int dist;
  if (dir == FWD) {
    dist = min(left_enc.getPulses(0), right_enc.getPulses(0));
  } else if (dir == LEFT) {
    dist = min(-left_enc.getPulses(0), right_enc.getPulses(0));
  } else if (dir == RIGHT) {
    dist = min(left_enc.getPulses(0), -right_enc.getPulses(0));
  } else {
    dist = 0;
  }

  int error = final - dist;
  int target;
  // Hack, should be fixed to look better
  if (dir == FWD) {
    target = kDistPNumerator * error / kDistPDenominator + kDistOL;
  } else {
    target = kTurnOL;
  }
  // Early return if going forwards and we hit a wall
  if (dir == FWD && front_ir < kFrontWallDist) {
    g_left_target_speed = 0;
    g_right_target_speed = 0;
    return true;
  }

  if (dist < final) {
    if (dir == LEFT) {
      g_left_target_speed = -target;
    } else {
      g_left_target_speed = target;
    }
    if (dir == RIGHT) {
      g_right_target_speed = -target;
    } else {
      g_right_target_speed = target;
    }

    // Ugly, should be refactored
    if (dir == FWD) {
      float left_ir_val = left_ir;
      float right_ir_val = right_ir;
      float l_error = left_ir_val - kIdealWallDist;
      float r_error = right_ir_val - kIdealWallDist;
      // Straighten with the walls
      if (left_ir < kWallDist) {
        int straighten = (int) (kStraightenD * l_error);
        g_left_target_speed -= straighten;
        g_right_target_speed += straighten;
      }
      if (right_ir < kWallDist) {
        int straighten = (int) (kStraightenD * r_error);
        g_left_target_speed += straighten;
        g_right_target_speed -= straighten;
      }

    }
    return false;
  } else {
    g_left_target_speed = 0;
    g_right_target_speed = 0;
    return true;
  }

}

// PI Control
// Uses the global g_target_speed
void speed_control(void) {
  static int i_term_l = 0;
  static int i_term_r = 0;
  static int prev_l_error = 0;
  static int prev_r_error = 0;

  int left_speed = kSpeedScaling * left_enc.getPulses(3);
  int right_speed = kSpeedScaling * right_enc.getPulses(3);
  left_enc.reset(3);
  right_enc.reset(3);


  // Early return if we're trying to stop, prevents grinding motor
  if (g_left_target_speed == 0 && g_right_target_speed == 0) {
    i_term_l = 0;
    i_term_r = 0;
    left_drive = 0;
    right_drive = 0;
  }

  // Do left side
  int l_error = g_left_target_speed - left_speed;
  i_term_l += kSpeedI * l_error;
  i_term_l = constrain(i_term_l, kMinITerm, kMaxITerm);
  int left_power = kSpeedOL * g_left_target_speed + kSpeedP * l_error +
                   i_term_l + kSpeedD * (l_error - prev_l_error);
  left_drive = constrain(left_power / kMaxPrescaledSpeed, -1.0f, 1.0f);
  prev_l_error = l_error;

  // Do right side
  int r_error = g_right_target_speed - right_speed;
  i_term_r += kSpeedI * r_error;
  i_term_r = constrain(i_term_r, kMinITerm, kMaxITerm);
  int right_power = kSpeedOL * g_right_target_speed + kSpeedP * r_error +
                    i_term_r + kSpeedD * (r_error - prev_r_error);
  right_drive = constrain(right_power / kMaxPrescaledSpeed, -1.0f, 1.0f);
  prev_r_error = r_error;

}

void runMotors(const int speed, const Directions dir) {
  // We can go about 40 clicks a cycle
  int spd = speed / 2;
  switch (dir) {
    case FWD:  // Forwards
      g_right_target_speed = spd;
      g_left_target_speed = spd;
      break;
    case BACK:  // Backwards
      g_right_target_speed = -spd;
      g_left_target_speed = -spd;
      break;
    case RIGHT:  // Right
      g_right_target_speed = -spd;
      g_left_target_speed = spd;
      break;
    case LEFT:  // Left
      g_right_target_speed = spd;
      g_left_target_speed = -spd;
      break;
    case STOP:  // Stop
      g_right_target_speed = 0;
      g_left_target_speed = 0;
      break;
  }
}

void coast(void) {
  right_drive = 0;
  left_drive = 0;
}

Timer claw_closing_timer;

// Will close claw if the sensor sees it
void check_claw(void) {
  if (claw_ir < kGrabbingDistance) {
    if (claw_closing_timer > .5) {
      claw = 1;
      send_claw_pos(claw.read(), true);
    }
  } else {
    claw_closing_timer.reset();
  }
}

int main() {
  claw_closing_timer.start();
  Timer claw_timer;
  claw_timer.start();

  Timer time_since_grabbed;
  time_since_grabbed.start();

  Ticker speed_loop_ticker;
  speed_loop_ticker.attach_us(speed_control, kSpeedControlLoopTime);

  Timeout motor_safety;

  Timer send_data_timer;
  send_data_timer.start();

  Timer dist_control_loop_timer;
  dist_control_loop_timer.start();

  int target_dist = 0; // Used in distance mode;
  Directions target_dir = STOP; // Used in distance mode;
  Modes mode = IDLE;



  char msg[kMaxMsgSize];
  for (;;) {
    if (claw_timer > kCheckClawTime &&
        time_since_grabbed > kDelayClawTime) {
      claw_timer.reset();
      check_claw();
    }
    switch (mode) {
      case MOVING:
        if (dist_control_loop_timer.read_us() > kDistControlLoopTime) {
          dist_control_loop_timer.reset();
          bool done = dist_control(target_dist, target_dir);
          if (done) {
            send_walls(target_dir);
            mode = IDLE;
          }
        }
        break;
      case IDLE:
      default:
       // Do nothing, for now
       break;
    }
    if (shooter.hasFired()) {
      char buffer[128];
      int len = sprintf(buffer, "{" KEY("id","shooter")
                                "," KEY("shot", 1) "}\n");
      bone.write(buffer, len);
    }
    if (bone.readable()) {
      bone.read(msg, kMaxMsgSize);
      switch (msg[0]) {
        // Get walls
        case 'w': {
          send_walls(STOP);
          break;
        }
        // gfXX - go direction for XX spaces
        case 'g': {
          if (mode == IDLE) {
            char dir = msg[1];
            switch(dir) {
              case 'f':
                // Prevent us from running into a wall!
                if (front_ir < kWallDist) {
                  target_dist = 0;
                  target_dir = STOP;
                } else {
                  target_dist = kSquareSize * kClicksPerInch;
                  target_dir = FWD;
                }
                break;
              case 'r':
                target_dist = kQuarterCircle;
                target_dir = RIGHT;
                break;
              case 'l':
                target_dist = kQuarterCircle;
                target_dir = LEFT;
                break;
              default:
                // Not recognized, do nothing
                break;
            }
            // We have to reset the encoders so we have the right distance
            left_enc.reset(0);
            right_enc.reset(0);
            mode = MOVING;
          }
          break;
        }
        // mfXX - go direction at speed, with safety after .5s
        case 'm': {
          mode = IDLE;
          Directions dir = charToDirection(msg[1]);
          int spd = (msg[2] - '0') * 10 + (msg[3] - '0');
          runMotors(spd, dir);
          if (dir != STOP) {
            motor_safety.attach(coast, 0.5);
          } else {
            motor_safety.detach();
          }
          break;
        }
        // Claw
        case 'c': {
          int pos = (msg[1] - '0') * 10 + (msg[2] - '0');
          claw = pos / kMaxClawPos;
          time_since_grabbed.reset();
          send_claw_pos(claw.read(), false);
          break;
        }
        // Shooter
        case 's': {
          shooter.fire();
          break;
        }
        case 'l': { // LEDs
          leds = leds ^ (1 << (msg[1] - '1'));
          break;
        }
      }
    }

    if (send_data_timer.read_us() > kSendDataTime) {
      send_data_timer.reset();
      send_ir();
      send_encoder();
      send_encoder_count();
    }
  }
  return -1; // End of program, should never be reached
}
