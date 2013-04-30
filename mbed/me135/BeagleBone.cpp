#include "BeagleBone.h"
namespace me135{

BeagleBone::BeagleBone(PinName tx, PinName rx) : uart_(tx,rx) {
  rx_out_ = 0;
  rx_in_ = 0;
  tx_out_ = 0;
  tx_in_ = 0;
  uart_.baud(kBaudRate);
  uart_.attach(this, &BeagleBone::uartRxHandler_, Serial::RxIrq);
  uart_.attach(this, &BeagleBone::uartTxHandler_, Serial::TxIrq);
}

bool BeagleBone::readable(void) {
  return rx_in_ != rx_out_;
}

void BeagleBone::read(char *str, const int len) {
  NVIC_DisableIRQ(UART3_IRQn);
  char c = 0;
  for (int i = 0; c != '\n' && i < len; i++) {
    if (!readable()) {
      NVIC_EnableIRQ(UART3_IRQn);
      while(!readable());
      NVIC_DisableIRQ(UART3_IRQn);
    }
    c = rx_buffer_[rx_out_];
    str[i] = c;
    rx_out_ = (rx_out_ + 1) % kBufferLen;
  }
  NVIC_EnableIRQ(UART3_IRQn);
  return;
}

bool BeagleBone::writeable_(void) {
  return tx_out_ != (tx_in_ + 1) % kBufferLen;
}

void BeagleBone::write(const char *str, const int len) {
  NVIC_DisableIRQ(UART3_IRQn);
  char c = 0;
  bool empty = tx_in_ == tx_out_;
  for (int i = 0; c != '\n' && i < len; i++) {
    if (!writeable_()) {
      NVIC_EnableIRQ(UART3_IRQn);
      while(!writeable_());
      NVIC_DisableIRQ(UART3_IRQn);
    }
    c = str[i];
    tx_buffer_[tx_in_] = c;
    tx_in_ = (tx_in_ + 1) % kBufferLen;
  }
  // Start transmissions if stopped
  if (empty && uart_.writeable()) {
    c = tx_buffer_[tx_out_];
    tx_out_ = (tx_out_ + 1) % kBufferLen;
    uart_.putc(c);
  }
  NVIC_EnableIRQ(UART3_IRQn);
  return;
}

void BeagleBone::uartTxHandler_(void) {
  while (uart_.writeable() && (tx_in_ != tx_out_)) {
    uart_.putc(tx_buffer_[tx_out_]);
    tx_out_ = (tx_out_ + 1) % kBufferLen;
  }
}

void BeagleBone::uartRxHandler_(void) {
  while (uart_.readable() && ((rx_in_ + 1) % kBufferLen != rx_out_)) {
    rx_buffer_[rx_in_] = uart_.getc();
    rx_in_ = (rx_in_ + 1) % kBufferLen;
  }
  return;
}

}
