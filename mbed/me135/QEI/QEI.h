/**
 * @author Aaron Berk
 *
 * @section LICENSE
 *
 * Copyright (c) 2010 ARM Limited
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

#ifndef QEI_H
#define QEI_H

#include "mbed.h"

#define PREV_MASK 0x1 //Mask for the previous state in determining direction
//of rotation.
#define CURR_MASK 0x2 //Mask for the current state in determining direction
//of rotation.
#define INVALID   0x3 //XORing two states where both bits have changed.

/**
 * Quadrature Encoder Interface.
 */
class QEI {

public:

    /**
     * Constructor.
     *
     * Reads the current values on channel A and channel B to determine the
     * initial state.
     *
     * Attaches the encode function to the rise/fall interrupt edges of
     * channels A and B to perform X4 encoding.
     *
     * @param channelA mbed pin for channel A input.
     * @param channelB mbed pin for channel B input.
     */
    QEI(PinName channelA, PinName channelB);

    /**
     * Reset the encoder.
     *
     * Sets the pulses and revolutions count to zero.
     */
    void reset(int ctr_num);

    /**
     * Read the state of the encoder.
     *
     * @return The current state of the encoder as a 2-bit number, where:
     *         bit 1 = The reading from channel B
     *         bit 2 = The reading from channel A
     */
    int getCurrentState(void);

    /**
     * Read the number of pulses recorded by the encoder.
     *
     * @return Number of pulses which have occured.
     */
    int getPulses(int ctr_num);

private:
    static const int kNumOfOffsets = 4;
    /**
     * Update the pulse count.
     *
     * Called on every rising/falling edge of channels A/B.
     *
     * Reads the state of the channels and determines whether a pulse forward
     * or backward has occured, updating the count appropriately.
     */
    void encode_(void);

    InterruptIn channelA_;
    InterruptIn channelB_;
    Timer timer_;
    int prevState_;
    int currState_;
    int offset_[kNumOfOffsets];

    volatile int pulses_;

};

#endif /* QEI_H */
