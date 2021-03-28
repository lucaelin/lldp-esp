/**
 *  @filename   :   epd1in54b.h
 *  @brief      :   Header file for e-paper display library epd154b.cpp
 *  @author     :   Yehui from Waveshare
 *
 *  Copyright (C) Waveshare     August 10 2017
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documnetation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to  whom the Software is
 * furished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS OR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

 // This code is taken from https://github.com/waveshare/e-Paper/tree/master/Arduino
 // Other modules should work with slight modification

#ifndef EPD2IN66_H
#define EPD2IN66_H

#include "epdif.h"
#include "driver/gpio.h"

// Display resolution
#define EPD_WIDTH       152
#define EPD_HEIGHT      296
#define EPD_REFRESH_TIMEOUT 5000

#define UWORD   unsigned int
#define UBYTE   unsigned char
#define UDOUBLE unsigned long

#define Epd     Epd2in66

class Epd2in66 : EpdIf {
public:
    int width;
    int height;

    Epd2in66();
    ~Epd2in66();

    int  Init(void);
    int  Init_Partial(void);
    void WaitUntilIdle(void);
    void DisplayFrame(const unsigned char* frame_buffer_black, const unsigned char* frame_buffer_red);
    void DisplayFrame_part(const UBYTE *Image, UWORD Xstart, UWORD Ystart, UWORD iwidth, UWORD iheight);
    void Sleep(void);
    void DisplayClear(void);
private:
    gpio_num_t reset_pin;
    gpio_num_t dc_pin;
    gpio_num_t cs_pin;
    gpio_num_t busy_pin;

    void Load_LUT(void);
    void TurnOnDisplay(void);
    void SendCommand(unsigned char command);
    void SendData(unsigned char data);
    void Reset(void);
};

#endif /* EPD2IN66_H */

/* END OF FILE */
