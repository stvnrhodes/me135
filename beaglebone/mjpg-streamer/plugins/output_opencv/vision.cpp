#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <termios.h>
#include <unistd.h>
#include <cv.h>
#include <highgui.h>

#include "vision.h"

namespace vision {
  int init(void) {
    return 0;
  }

  int loop(cv::Mat src) {
    cv::Mat src_gray;
    cv::cvtColor( src, src_gray, CV_BGR2GRAY );
    cv::GaussianBlur( src_gray, src_gray, cv::Size(9, 9), 2, 2 );

    std::vector<cv::Vec3f> circles;

    /// Apply the Hough Transform to find the circles
    cv::HoughCircles( src_gray, circles, CV_HOUGH_GRADIENT, 1, src_gray.rows/8, 200, 100, 0, 0 );

    for( size_t i = 0; i < circles.size(); i++ ) {
      cv::Point center(cvRound(circles[i][0]), cvRound(circles[i][1]));
      int radius = cvRound(circles[i][2]);
      std::cout << center << radius << std::endl;
      // circle center
      cv::circle( src, center, 3, cv::Scalar(0,255,0), -1, 8, 0 );
      // circle outline
      cv::circle( src, center, radius, cv::Scalar(0,0,255), 3, 8, 0 );
    }
    cv::imwrite("circles.jpg", src);
    return 0;
  }
}