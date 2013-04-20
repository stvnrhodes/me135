// Print "Hello World" to the PC

#include "mbed.h"
#include "me135.h"
#define VERBOSE
#define KEY(x,y) #x ":" #y
static const int kPuslesPerRotation = 333;

me135::BeagleBone bone(p9, p10);
DigitalOut led1(LED1);
DigitalOut led2(LED2);
DigitalOut led3(LED3);
DigitalOut led4(LED4);
DigitalIn but(p5);
me135::Shooter shooter(p25, p26);
me135::Claw claw(p20);
me135::DriveTrain right_drive(p22, p21);
me135::DriveTrain left_drive(p23, p24);
me135::IRSensor front(p15);
me135::IRSensor left(p16);
me135::IRSensor right(p17);
QEI left_encoder(p27, p28, NC, kPuslesPerRotation);
QEI right_encoder(p29, p30, NC, kPuslesPerRotation);
Timer encTimer;

const int MAX_MSG_SIZE = 10;
const float MAX_SPEED = 10.0;

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


int main() {
  Timer simulation_timer;
  simulation_timer.start();
  Timeout motor_safety;
  encTimer.start();
  Timer ir_timer;
  ir_timer.start();
  Modes mode = WAITING;
  x_coord
  Directions orientation;

  char msg[MAX_MSG_SIZE];
  for (;;) {
	switch (mode) {
  	case WAITING:
  	  simulation_timer.reset();
  	  break;
  	case MOVE_FORWARD:
  	  if (simulation_timer.read() > 0.5) {

  	    mode = WAITING;
  	  }
  	  break;
  	case TURN_RIGHT:
      if (simulation_timer.read() > 0.5) {
        orientation = real_direction[orientation][RIGHT];
        mode = WAITING;
      }
  	  break;
  	case TURN_LEFT:
      if (simulation_timer.read() > 0.5) {

        orientation = real_direction[orientation][LEFT];
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
        // gfXX - go direction for XX spaces
        case 'g': {
//          char dir = msg[1];
//          int spd = msg[2] * 10 + msg[3];
          // TODO: Implement method
          break;
        }
        // s - stop
        case 's': {
          switch (msg[1]) {
            case 'i':
              // TODO: Stop immediately
              break;
            case 'c':
              // TODO: Stop at next cell
              break;
          }
        }
        // mfXX - go direction at speed, with safety after .5s
        case 'm': {
          char dir = msg[1];
          int spd = msg[2] * 10 + msg[3];
          runMotors(spd * 1.0, dir);
          if (dir != 's') {
            motor_safety.attach(coast, 0.5);
          } else {
            motor_safety.detach();
          }
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
        case 'e': { // Encoders
          left_encoder.reset();
          right_encoder.reset();
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
      len = sprintf(buffer, "{" KEY("id", "encoder") "," KEY("left_encoder", %d)
                            "," KEY("right_encoder", %d) "}\n",
                            left_encoder.getPulses(), right_encoder.getPulses());
      bone.write(buffer, len);
      encTimer.reset();
    }
  }
}
