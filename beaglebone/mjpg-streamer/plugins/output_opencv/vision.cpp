#include "vision.h"
#define KEY(x,y) #x ":" #y

Vision::Vision(void) {
  struct sockaddr_un server;

  _sockfd = socket(AF_UNIX, SOCK_STREAM, 0);
  if (_sockfd < 0) {
      perror("opening stream socket");
  }
  server.sun_family = AF_UNIX;
  strcpy(server.sun_path, "/tmp/opencv.sock");


  if (connect(_sockfd, (struct sockaddr *) &server,
      sizeof(struct sockaddr_un)) < 0) {
    close(_sockfd);
    perror("connecting stream socket");
  }
  _color[0] = cv::Vec3b(0,0,0);
  _color[1] = cv::Vec3b(0,0,0);
  _true_color[0] = cv::Vec3b(0,0,0);
  _true_color[0] = cv::Vec3b(0,0,0);
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

void Vision::_thresholdImage(const cv::Mat img, const cv::Vec3b pixel,
    cv::Mat &output) {
  cv::Scalar low(pixel[0] - 10, pixel[1] - 10, pixel[2] - 10);
  cv::Scalar high(pixel[0] + 10, pixel[1] + 10, pixel[2] + 10);
  cv::Mat imgHSV;
  cv::cvtColor(img, imgHSV, CV_RGB2HSV);
  cv::inRange(imgHSV, low, high, output);
}

int Vision::loop(cv::Mat src) {

  // Check if there's a message waiting
  int len = 0;
  ioctl(_sockfd, FIONREAD, &len);
  if (len > 0) {
    char buffer[80];
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

    // Update the color we're seeking
    int channel = msg.get("type", -1).asInt();
    int x = msg.get("x", -1 ).asInt();
    int y = msg.get("y", -1 ).asInt();
    if (channel != -1 && x != -1 && y != -1) {
      _true_color[channel] = src.at<cv::Vec3b>(y, x);
      _color[channel] = _getPixel(src, x, y);
    }

    // TODO: Change to use streams
    sprintf(buffer, "{" KEY("id","color")
                    "," KEY("ally", "#%.2x%.2x%.2x")
                    "," KEY("enemy","#%.2x%.2x%.2x") "}\n",
                    _true_color[0][0], _true_color[0][2], _true_color[0][2],
                    _true_color[1][0], _true_color[1][2], _true_color[1][2]);
    if (write(_sockfd, buffer, strlen(buffer)) < 0) {
      perror("writing on stream socket");
    }
  }

  std::ostringstream output_stream;
  output_stream << "{" KEY("id", "moments");
  for (int i = 0; i < kNumColors; i++) {
    if (_color[i][0] != 0 && _color[i][1] != 0 && _color[i][2] != 0) {
      cv::Mat threshed;
      _thresholdImage(src, _color[i], threshed);
      cv::Moments moments = cv::moments(threshed);
      if (moments.m00 > 0) {
        output_stream << ",\"" << i << "m10\":" << moments.m10 <<
                         ",\"" << i << "m01\":" << moments.m01 <<
                         ",\"" << i << "m00\":" << moments.m00;
      }
    }
  }
  output_stream << "}" << std::endl;

  std::string output = output_stream.str();
  if (write(_sockfd, output.c_str(), output.length()) < 0) {
    perror("writing on stream socket");
  }

  // Force the socket to send;
  fflush(NULL);
  return 1;
}
