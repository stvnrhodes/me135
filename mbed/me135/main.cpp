#include "mbed.h"
#include "me135.h"
#define VERBOSE
#define KEY(x,y) #x ":" #y

BusOut leds(LED1, LED2, LED3, LED4);
me135::BeagleBone bone(p9, p10);
QEI right_enc(p11, p12);
QEI left_enc(p13, p14);
me135::IRSensor front_ir(p15);
me135::IRSensor left_ir(p16);
me135::IRSensor right_ir(p17);
me135::DriveTrain right_drive(p21, p22);
me135::DriveTrain left_drive(p24, p23);
me135::Shooter shooter(p28, p25, p26);
me135::Claw claw(p29);

volatile int g_left_target_speed = 0;
volatile int g_right_target_speed = 0;


// We send the data back so we can have pretty graphs
void send_ir(void) {
  char buffer[256];
  int len = sprintf(buffer, "{" KEY("id","ir")
                            "," KEY("front", %f)
                            "," KEY("left",%f)
                            "," KEY("right",%f) "}\n",
                        front_ir.read(), left_ir.read(), right_ir.read());
  bone.write(buffer, len);
}

void send_encoder(void) {
  printf("sending encoder\r\n");
  char buffer[256];
  int len = sprintf(buffer, "{" KEY("id", "encoder")
                            "," KEY("left_enc", %d)
                            "," KEY("right_enc", %d) "}\n",
                left_enc.getPeriod(), right_enc.getPeriod());
  bone.write(buffer, len);
}

void send_walls(void) {
  char buffer[256];
  char len = sprintf(buffer, "{" KEY("id","maze_walls")
                             "," KEY("left",%d)
                             "," KEY("right",%d)
                             "," KEY("center",%d)
                             "}\n", left_ir < 5, right_ir < 5, front_ir < 5);
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
  // TODO: Use walls to go straight
  // left_enc->reset(0);
  // right_enc->reset(0);
  int error = final - dist;
  int target = kDistP * error;
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

  // True if complete
  return dist > final;
}

// PI Control
// Uses the global g_target_speed
void speed_control(void) {
//  static int i_term_l = 0;
//  static int i_term_r = 0;

  int left_speed = kUsPerS * kSpeedScaling / left_enc.getPeriod();
  int right_speed = kUsPerS * kSpeedScaling / right_enc.getPeriod();

  // DUMB BANG BANG
  left_speed > g_left_target_speed ? left_drive = 0 : left_drive = 1;
  right_speed > g_right_target_speed ? right_drive = 0 : right_drive = 1;

  // Actual code?
  // int l_error = g_left_target_speed - l_speed;
  // i_term_l += kSpeedI * error;
  // int left_power = kSpeedOL * left_speed + kSpeedP * error + i_term_l;
  // left_drive = constrain(left_power / kMaxPrescaledSpeed, -1, 1);

  // int r_error = g_right_target_speed - r_speed;
  // i_term_r += kSpeedI * error;
  // int right_power = kSpeedOL * right_speed + kSpeedP * error + i_term_r;
  // right_drive = constrain(right_power / kMaxPrescaledSpeed, -1, 1);
}

void runMotors(const int speed, const Directions dir) {
  float spd = speed / kMaxSpeed;
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

int main() {
  Ticker speed_loop_ticker;
  speed_loop_ticker.attach_us(speed_control, kSpeedControlLoopTime);

  Timeout motor_safety;

  Timer send_data_timer;
  send_data_timer.start();

  Timer dist_control_loop_timer;
  dist_control_loop_timer.start()

  int target_dist = 0; // Used in distance mode;
  Directions target_dir = STOP; // Used in distance mode;
  Modes mode = IDLE;

  char msg[kMaxMsgSize];
  for (;;) {
    switch (mode) {
      case MOVING:
        if (dist_control_loop_timer.read_us() > kDistControlLoopTime) {
          dist_control_loop_timer.reset();
          bool done = dist_control(target_dist, target_dir);
          if (done) {
            send_walls();
            mode = IDLE;
          }
        }
        break;
      case IDLE:
      default:
       // Do nothing, for now
       break;
    }
    if (bone.readable()) {
      bone.read(msg, kMaxMsgSize);
      switch (msg[0]) {
        // Get walls
        case 'w': {
          send_walls();
        }
        // gfXX - go direction for XX spaces
        case 'g': {
          if (mode == IDLE) {
            char dir = msg[1];
            switch(dir) {
              case 'f':
                target_dist = kSquareSize * kClicksPerInch * kSpeedScaling;
                target_dir = FWD;
                break;
              case 'r':
                target_dist = kQuarterCircle * kClicksPerDeg * kSpeedScaling;
                target_dir = RIGHT;
                break;
              case 'l':
                target_dist = kQuarterCircle * kClicksPerDeg * kSpeedScaling;
                target_dir = LEFT;
                break;
              case 'b':
                target_dist = kHalfCircle * kClicksPerDeg * kSpeedScaling;
                target_dir = LEFT;
                break;
              default:
                // Not recognized, do nothing
                break;
            }
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
    }
  }
  return -1; // End of program, should never be reached
}
