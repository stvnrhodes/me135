#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <termios.h>
#include <unistd.h>
#include "opencv/cv.h"
#include "opencv/highgui.h"

#define NB_ENABLE 1
#define NB_DISABLE 0

int kbhit() {
  struct timeval tv;
  fd_set fds;
  tv.tv_sec = 0;
  tv.tv_usec = 0;
  FD_ZERO(&fds);
  FD_SET(STDIN_FILENO, &fds); //STDIN_FILENO is 0
  select(STDIN_FILENO+1, &fds, NULL, NULL, &tv);
  return FD_ISSET(STDIN_FILENO, &fds);
}

void nonblock(int state) {
  struct termios ttystate;
  tcgetattr(STDIN_FILENO, &ttystate);
  if (state==NB_ENABLE) {
    ttystate.c_lflag &= ~ICANON;
    ttystate.c_cc[VMIN] = 1;
  } else if (state==NB_DISABLE) {
      ttystate.c_lflag |= ICANON;
  }
  tcsetattr(STDIN_FILENO, TCSANOW, &ttystate);
}

int main( int argc, char **argv){
  cv::Mat frame, modified_frame;
  char key = 0;

    /* initialize camera */
  std::cout << "Initializing Camera\n";
  cv::VideoCapture capture(0);
    /* always check */
  if ( !capture.isOpened() ) {
    std::cerr << "Cannot open initialize webcam!\n";
    return 1;
  }
  std::cout << "Camera Initialized\n";
  capture.set(CV_CAP_PROP_FRAME_WIDTH, 320);
  capture.set(CV_CAP_PROP_FRAME_HEIGHT, 240);
  std::cout << "Capturing\n";
  nonblock(NB_ENABLE);

  cv::Size S((int) capture.get(CV_CAP_PROP_FRAME_WIDTH),    // Acquire input size
                  (int) capture.get(CV_CAP_PROP_FRAME_HEIGHT));
  while( key != 'q' ) {
    /* get a frame */
    capture >> frame;
    cv::GaussianBlur(frame, modified_frame, cv::Size(7,7), 1.5, 1.5);
    cv::Canny(modified_frame, modified_frame, 0, 30, 3);

    /* exit if user press 'q' */
    usleep(10000);
    key = kbhit();
    if (key != 0) {
      std::cin >> key;
      switch(key) {
        case 's':
          cv::imwrite("cam.jpg", frame);
          cv::imwrite("edge.jpg", modified_frame);
          std::cout << "Saved\n";
          break;
      }
    }
  }

  nonblock(NB_DISABLE);

  return 0;
}
