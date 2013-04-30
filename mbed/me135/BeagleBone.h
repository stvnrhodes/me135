#ifndef _BEAGLEBONE_H_
#define _BEAGLEBONE_H_
#include "mbed.h"

namespace me135 {
/**
 * Encapsulates a uart connection to the BeagleBone
 *
 * Buffers up to kBufferLen characters
 *
 * Strings sent to a full buffer will be discarded
 */
class BeagleBone {
 public:
  /**
   * Constructor
   *
   * @param tx The transmit pin name
   * @param rx The receive pin name
   */
  BeagleBone(PinName tx, PinName rx);

  /**
   * Copies a string from the circular buffer into the given buffer
   * @param str The destination for copying
   * @param Maximum number of bytes to copy
   */
  void read(char *str, const int len);
  /**
   * Checks if there are strings available
   * @return Strings are available
   */
  bool readable(void);
  /**
   * Writes the string to the bone
   * @param str The string to write
   * @param len Length of string
   */
  void write(const char *str, const int len);

 private:
  static const int kBufferLen = 512;
  static const int kBaudRate = 115200;
  Serial uart_;
  bool writeable_(void);
  void uartTxHandler_(void);
  void uartRxHandler_(void);
  char rx_buffer_[kBufferLen];
  volatile int rx_in_;
  volatile int rx_out_;
  char tx_buffer_[kBufferLen];
  volatile int tx_out_;
  volatile int tx_in_;
};
}
#endif // _BEAGLEBONE_H_
