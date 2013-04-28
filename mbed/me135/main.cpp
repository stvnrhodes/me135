// Print "Hello World" to the PC

#include "mbed.h"
#include "rtos.h"
#include "me135.h"
#include "TankDrive.h"
#define VERBOSE
#define KEY(x,y) #x ":" #y
static const int kPuslesPerRotation = 333;

DigitalOut led1(LED1);
DigitalOut led2(LED2);
DigitalOut led3(LED3);
DigitalOut led4(LED4);
me135::BeagleBone bone(p9, p10);
QEI right_encoder(p11, p12);
QEI left_encoder(p13, p14);
me135::IRSensor front(p15);
me135::IRSensor left(p16);
me135::IRSensor right(p17);
me135::DriveTrain right_drive(p21, p22);
me135::DriveTrain left_drive(p24, p23);
me135::Shooter shooter(p28, p25, p26);
me135::Claw claw(p29);
me135::TankDrive tank(&left_drive, &right_drive, &left_encoder, &right_encoder);
Timer encTimer;

const int MAX_MSG_SIZE = 10;
const float MAX_SPEED = 10.0;

void distControl() {

}

void runMotors(float spd, char func) {
  spd = spd / MAX_SPEED;
  switch (func) {
    case 'f':  // Forwards
      right_drive = spd;
      left_drive = spd;
      break;
    case 'b':  // Backwards
      right_drive = -spd;
      left_drive = -spd;
      break;
    case 'r':  // Right
      right_drive = -spd;
      left_drive = spd;
      break;
    case 'l':  // Left
      right_drive = spd;
      left_drive = -spd;
      break;
    case 's':  // Stop
      right_drive.brake(spd);
      left_drive.brake(spd);
      break;
  }
}

void coast(void) {
  right_drive = 0;
  left_drive = 0;
}

void print_walls(Directions orientation, int xc, int yc) {
  const bool *walls = fake_maze[xc][yc];
  bool left = walls[real_direction[orientation][LEFT]];
  bool front = walls[orientation];
  bool right = walls[real_direction[orientation][RIGHT]];

  char buffer[256];
  char len;
  len = sprintf(buffer, "{" KEY("id", "maze_walls")
                        "," KEY("left", %d)
                        "," KEY("center", %d)
                        "," KEY("right", %d)
                        "," KEY("x", %d)
                        "," KEY("y", %d)
                        "," KEY("dir", %d) "}\n",
                left, front, right, xc, yc, orientation);
  bone.write(buffer, len);
}

int main() {
  Timer simulation_timer;
  simulation_timer.start();
  Timeout motor_safety;
  encTimer.start();
  Timer ir_timer;
  ir_timer.start();
  Modes mode = WAITING;
  int xc = 0;
  int yc = 0;
  Directions orientation = UP;

  char msg[MAX_MSG_SIZE];
  for (;;) {
    switch (mode) {
      case WAITING:
        simulation_timer.reset();
        break;
      case MOVE_FORWARD:
        if (simulation_timer.read() > 0.1) {
          switch(orientation) {
            case UP:
              if (fake_maze[xc][yc][UP] || xc == 0) {
                printf("We just ran into a wall\r\n");
              } else {
                xc -= 1;
              }
              break;
            case DOWN:
              if (fake_maze[xc][yc][DOWN] || xc == FAKE_MAZE_ROWS - 1) {
                printf("We just ran into a wall\r\n");
              } else {
                xc += 1;
              }
              break;
            case LEFT:
              if (fake_maze[xc][yc][LEFT] || yc == 0) {
                printf("We just ran into a wall\r\n");
              } else {
                yc -= 1;
              }
              break;
            case RIGHT:
              if (fake_maze[xc][yc][RIGHT] || yc == FAKE_MAZE_COLUMNS - 1) {
                printf("We just ran into a wall\r\n");
              } else {
                yc += 1;
              }
              break;
          }
          print_walls(orientation, xc, yc);
          mode = WAITING;
        }
        break;
      case TURN_RIGHT:
        if (simulation_timer.read() > 0.1) {
          orientation = real_direction[orientation][RIGHT];
          print_walls(orientation, xc, yc);
          mode = WAITING;
        }
        break;
      case TURN_LEFT:
        if (simulation_timer.read() > 0.1) {
          orientation = real_direction[orientation][LEFT];
          print_walls(orientation, xc, yc);
          mode = WAITING;
        }
        break;
      case ERROR:
      default:
        break;
    }
    if (bone.readable()) {
      bone.read(msg, MAX_MSG_SIZE);
      switch (msg[0]) {
        // Get walls
        case 'w': {
          print_walls(orientation, xc, yc);
        }
        // gfXX - go direction for XX spaces
        case 'g': {
          char dir = msg[1];
          switch(dir) {
            case 'f':
              mode = MOVE_FORWARD;
              break;
            case 'r':
              mode = TURN_RIGHT;
              break;
            case 'l':
              mode = TURN_LEFT;
              break;
            default:
              mode = WAITING;
          }
          break;
        }
        // mfXX - go direction at speed, with safety after .5s
        case 'm': {
          char dir = msg[1];
          int spd = (msg[2] - '0') * 10 + (msg[3] - '0');
          runMotors(spd * 1.0, dir);
          if (dir != 's') {
            motor_safety.attach(coast, 0.5);
          } else {
            motor_safety.detach();
          }
          break;
        }
        // Shooter
        case 's': {
          shooter.fire();
		      break;
        }
        case 'l': { // LEDs
          switch(msg[1]) {
            case '1': {
              led1 = !led1;
              break;
            }
            case '2': {
              led2 = !led2;
              break;
            }
            case '3': {
              led3 = !led3;
              break;
            }
            case '4': {
              led4 = !led4;
              break;
            }
          }
          break;
        }
      }
    }
    if (ir_timer.read_ms() > 100) {
      char buffer[256];
      char len;
      len = sprintf(buffer, "{" KEY("id","ir")
                            "," KEY("front", %f)
                            "," KEY("left",%f)
                            "," KEY("right",%f) "}\n",
                            front.read(), left.read(), right.read());
      bone.write(buffer, len);
      ir_timer.reset();
    }
    if (encTimer.read_ms() > 250) {
      char buffer[256];
      char len;
      len = sprintf(buffer, "{" KEY("id", "encoder")
                            "," KEY("left_encoder", %d)
                            "," KEY("right_encoder", %d) "}\n",
                    left_encoder.getPulses(0), right_encoder.getPulses(0));
      left_encoder.reset(0);
      right_encoder.reset(0);
      bone.write(buffer, len);
      encTimer.reset();
    }
  }
}
