#include <stdio.h>
#include <stdlib.h>
#include <opencv/cv.h>
#include <opencv/highgui.h>
#include <time.h>


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
  time_t start,end;

  CvCapture *capture = 0;
  IplImage  *frame = 0;
  IplImage  *newframe = 0;
  CvMemStorage* storage = cvCreateMemStorage(0);
  CvSeq* contour = 0;
  CvMoments moments;
  int       key = 0;

    /* initialize camera */
  capture = cvCaptureFromCAM(0);
  cvSetCaptureProperty(capture, CV_CAP_PROP_FRAME_WIDTH, 160);
  cvSetCaptureProperty(capture, CV_CAP_PROP_FRAME_HEIGHT, 120);
  cvSetCaptureProperty(capture, CV_CAP_PROP_FPS, 5);
    /* always check */
  if ( !capture ) {
    fprintf( stderr, "Cannot open initialize webcam!\n" );
    return 1;
  }

    /* create a window for the video */
  cvNamedWindow( "result", CV_WINDOW_AUTOSIZE );
  cvNamedWindow( "unfiltered", CV_WINDOW_AUTOSIZE );

  time(&start);
  int counter=0;


  while( key != 'q' ) {
    /* get a frame */
    newframe = cvQueryFrame( capture );
    frame = GetThresholdedImage(newframe);
    cvShowImage( "result", frame );
    cvFindContours( frame, storage, &contour, sizeof(CvContour));
    for( ; contour != 0; contour = contour->h_next )
    {
        color = cvRGB(255,0,0);
        cvMoments(contour, &moments);
        cvCircle(newframe, cvPoint((moments.m10/moments.m00),(moments.m01/moments.m00)), 2, CV_RGB( 255, 0, 0));
        /* replace CV_FILLED with 1 to see the outlines */
        cvDrawContours( newframe, contour, color, color, -1, /*CV_FILLED*/1, 8 );
    }
    if( !frame )
    {
      break;
      fprintf( stdout, "ERROR: frame is null...\n" );
    }
    //Stop the clock and show FPS
    time(&end);
    ++counter;
    double sec=difftime(end,start);
    double fps=counter/sec;
    printf("\n%lf",sec/counter);
    /* display current frame */
    cvShowImage( "unfiltered", newframe );

    /* exit if user press 'q' */
    key = cvWaitKey( 1 );
    if(key=='s') {
      cvSaveImage("test.jpg",newframe);
    }
  }

    /* free memory */
  cvDestroyWindow( "result" );
  cvDestroyWindow( "unfiltered" );
  cvReleaseCapture( &capture );

  return 0;
}

// #include "opencv/cv.h"
// #include "opencv/highgui.h"
// #include <iostream>

// int main(int, char**) {
//     cv::VideoCapture vcap;
//     cv::Mat image;

//     const std::string videoStreamAddress = "http://localhost:8080/?action=snapshot";
//     /* it may be an address of an mjpeg stream,
//     e.g. "http://user:pass@cam_address:8081/cgi/mjpg/mjpg.cgi?.mjpg" */

//     //open the video stream and make sure it's opened
//     if(!vcap.open(videoStreamAddress)) {
//         std::cout << "Error opening video stream or file" << std::endl;
//         return -1;
//     }

//     for(;;) {
//         if(!vcap.read(image)) {
//             std::cout << "No frame" << std::endl;
//             cv::waitKey();
//         }
//         cv::imshow("Output Window", image);
//         if(cv::waitKey(1) >= 0) break;
//     }
// }
