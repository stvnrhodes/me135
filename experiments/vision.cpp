#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
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

IplImage* GetThresholdedImage(IplImage* img) {
  // Convert the image into an HSV image
  IplImage* imgHSV = cvCreateImage(cvGetSize(img), 8, 3);
  cvCvtColor(img, imgHSV, CV_BGR2HSV);
  IplImage* imgThreshed = cvCreateImage(cvGetSize(img), 8, 1);
  // hsl(145, 57%, 72%)
  // hsl(115, 45%, 55%)
  // hsl(102, 61%, 33%)
  cvInRangeS(imgHSV, cvScalar(30, 50, 50), cvScalar(50, 255, 255), imgThreshed);
  cvReleaseImage(&imgHSV);
  cvErode(imgThreshed, imgThreshed);
  return imgThreshed;
}

int main( int argc, char **argv){

  CvCapture *capture = 0;
  IplImage  *frame = 0;
  IplImage  *newframe = 0;
  CvMemStorage* storage = cvCreateMemStorage(0);
  CvSeq* contour = 0;
  CvMoments moments;
  timeval stop2, start2;
  int       key = 0;

    /* initialize camera */
  capture = cvCreateCameraCapture(0);
    /* always check */
  if ( !capture ) {
    fprintf( stderr, "Cannot open initialize webcam!\n" );
    return 1;
  }
  cvSetCaptureProperty(capture, CV_CAP_PROP_FRAME_WIDTH, 160);
  cvSetCaptureProperty(capture, CV_CAP_PROP_FRAME_HEIGHT, 120);

  nonblock(NB_ENABLE);
  while( key != 'q' ) {
    /* get a frame */
    newframe = cvQueryFrame( capture );
    frame = GetThresholdedImage(newframe);
    cvFindContours( frame, storage, &contour, sizeof(CvContour));
    for( ; contour != 0; contour = contour->h_next )
    {
        CvScalar color = CV_RGB(255,0,0);
        cvMoments(contour, &moments);
        float x = moments.m10/moments.m00;
        float y = moments.m01/moments.m00;
        std::cout << x << ',' << y << std::endl;
        break;
    }
    if( !frame )
    {
      break;
      fprintf( stdout, "ERROR: frame is null...\n" );
    }

    /* exit if user press 'q' */
    // key = getchar();
    // std::fflush(stdin);
    usleep(10000);
    key = kbhit();
    if(key == 's') {
      cvSaveImage("test.jpg",newframe);
    }
  }

    /* free memory */
  nonblock(NB_DISABLE);
  cvReleaseCapture( &capture );

  return 0;
}
