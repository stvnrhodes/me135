#include "vision.h"

Vision::Vision(void) {
  struct sockaddr_un server;

  _sockfd = socket(AF_UNIX, SOCK_STREAM, 0);
  if (_sockfd < 0) {
      perror("opening stream socket");
  }
  server.sun_family = AF_UNIX;
  strcpy(server.sun_path, "/tmp/opencv.sock");


  if (connect(_sockfd, (struct sockaddr *) &server, sizeof(struct sockaddr_un)) < 0) {
      close(_sockfd);
      perror("connecting stream socket");
  }
  _color = cv::Vec3b(0,0,0);

}

Vision::~Vision(void) {
  close(_sockfd);
}

cv::Vec3b Vision::_getPixel(const cv::Mat img, const int x, const int y) {
  // Convert the image into an HSV image
  cv::Mat imgHSV;
  cv::cvtColor(img, imgHSV, CV_RGB2HSV);
  return imgHSV.at<cv::Vec3b>(y,x);
}

void Vision::_thresholdImage(const cv::Mat img, const cv::Vec3b pixel, cv::Mat &output) {
  cv::Scalar low(pixel[0] - 4, pixel[1] - 40, pixel[2] - 40);
  cv::Scalar high(pixel[0] + 4, pixel[1] + 40, pixel[2] + 40);
  cv::Mat imgHSV;
  cv::cvtColor(img, imgHSV, CV_RGB2HSV);
  cv::inRange(imgHSV, low, high, output);
}

int Vision::loop(cv::Mat src) {
  char buffer[80];
  int len = 0;
  // cv::blur( src, src, cv::Size( BLUR_FACTOR, BLUR_FACTOR ), cv::Point(-1,-1) );
  ioctl(_sockfd, FIONREAD, &len);
  if (len > 0) {
    len = read(_sockfd, buffer, len);
    Json::Value msg;   // will contains the root value after parsing.
    Json::Reader reader;
    bool parsingSuccessful = reader.parse( buffer, msg );
    if ( !parsingSuccessful ) {
        // report to the user the failure and their locations in the document.
      std::cerr  << "Failed to parse configuration\n"
      << reader.getFormattedErrorMessages();
      return -1;
    }
    int x = msg.get("x", -1 ).asInt();
    int y = msg.get("y", -1 ).asInt();
    if (x != -1 && y != -1) {
      _color = _getPixel(src, x, y);
    }
    Json::Value ret_msg;
    ret_msg["x"] = x;
    ret_msg["y"] = y;
    Json::StyledWriter writer;
    std::string outputConfig = writer.write( ret_msg );
    if (write(_sockfd, outputConfig.c_str(), outputConfig.length()) < 0) {
      perror("writing on stream socket");
    }
  }

  _thresholdImage(src, _color, src);
  cv::Moments moments = cv::moments(src);

  // Json::Value ret_msg;
  // ret_msg["id"] = "moments";
  // ret_msg["m10"] = moments.m10;
  // ret_msg["m01"] = moments.m01;
  // ret_msg["m00"] = moments.m00;
  // Json::StyledWriter writer;
  // std::string outputConfig = writer.write( ret_msg );
  std::ostringstream output_stream;
  output_stream << "{\"id\":\"moments\",\"m10\":" << moments.m10 <<
                   ",\"m01\":" << moments.m01 <<
                   ",\"m00\":" << moments.m00 << "}";
  std::string output = output_stream.str();
  if (write(_sockfd, output.c_str(), output.length()) < 0) {
    perror("writing on stream socket");
  }
  return 1;
}