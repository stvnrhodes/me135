#ifndef VISION_H
#define VISION_H

#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <iostream>
#include <termios.h>
#include <unistd.h>
#include <cv.h>
#include <highgui.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/ioctl.h>
#include <json/json.h>


class Vision {
 public:
  Vision(void);
  ~Vision(void);
  int loop(cv::Mat src);
 private:
  static const int kNumColors = 2;
  cv::Vec3b _getPixel(const cv::Mat img, const int x, const int y);
  void _thresholdImage(const cv::Mat img, const cv::Vec3b pixel, cv::Mat &output);
  int _sockfd;
  cv::Vec3b _color[kNumColors];
  cv::Vec3b _true_color[kNumColors];
};
#endif // VISION_H