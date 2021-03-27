/**
 *  @filename   :   epd1in54b.cpp
 *  @brief      :   Implements for e-paper display library
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

#include <stdlib.h>
#include "epd2in66.h"
#include "sdkconfig.h"

static const UBYTE WF_PARTIAL[159] =
{
0x00,0x40,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x80,0x80,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x40,0x40,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x80,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x0A,0x00,0x00,0x00,0x00,0x00,0x02,0x01,0x00,0x00,
0x00,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x00,0x00,0x22,0x22,0x22,0x22,0x22,0x22,
0x00,0x00,0x00,0x22,0x17,0x41,0xB0,0x32,0x36,
};

Epd2in66::~Epd() {
};

Epd2in66::Epd() {
    reset_pin = (gpio_num_t)CONFIG_EINK_RST;
    dc_pin = (gpio_num_t)CONFIG_EINK_DC;
    cs_pin = (gpio_num_t)CONFIG_EINK_SPI_CS;
    busy_pin = (gpio_num_t)CONFIG_EINK_BUSY;
    width = EPD_WIDTH;
    height = EPD_HEIGHT;
};

/******************************************************************************
function :	Turn On Display
parameter:
******************************************************************************/
void Epd2in66::TurnOnDisplay(void)
{
    SendCommand(0x20);
    WaitUntilIdle();
}

int Epd2in66::Init(void) {
    /* this calls the peripheral hardware interface, see epdif */
    if (IfInit() != 0) {
        return -1;
    }
    /* EPD hardware init start */
    Reset();

    WaitUntilIdle();
	SendCommand(0x12);//soft  reset
	WaitUntilIdle();
	/*	Y increment, X increment	*/
	SendCommand(0x11);
	SendData(0x03);
	/*	Set RamX-address Start/End position	*/
	SendCommand(0x44);
	SendData(0x01);
	SendData((width % 8 == 0)? (width / 8 ): (width / 8 + 1) );
	/*	Set RamY-address Start/End position	*/
	SendCommand(0x45);
    SendData(0);
	SendData(0);
    SendData((height&0xff));
    SendData((height&0x100)>>8);
    WaitUntilIdle();

    /* EPD hardware init end */

    return 0;
}


/**
 *  @brief: Initialize the e-Paper register(Partial display)
 */
int Epd2in66::Init_Partial(void) {
	  Reset();

    WaitUntilIdle();
    SendCommand(0x12);//soft  reset
    WaitUntilIdle();

    Load_LUT();
    SendCommand(0x37);
    SendData(0x00);
    SendData(0x00);
    SendData(0x00);
    SendData(0x00);
    SendData(0x00);
    SendData(0x40);
    SendData(0x00);
    SendData(0x00);
    SendData(0x00);
    SendData(0x00);

	/* Y increment, X increment */
    SendCommand(0x11);
    SendData(0x03);
    /*	Set RamX-address Start/End position	*/
    SendCommand(0x44);
    SendData(0x01);
    SendData((width % 8 == 0)? (width / 8 ): (width / 8 + 1) );
    /*	Set RamY-address Start/End position	*/
    SendCommand(0x45);
    SendData(0);
    SendData(0);
    SendData((height&0xff));
    SendData((height&0x100)>>8);

    SendCommand(0x3C);
    SendData(0x80);

    SendCommand(0x22);
    SendData(0xcf);
    SendCommand(0x20);
    WaitUntilIdle();
	  return 0;
}

/******************************************************************************
function :  set the look-up tables
parameter:
******************************************************************************/
void Epd2in66::Load_LUT(void) {
	UWORD i;
	SendCommand(0x32);
	for (i = 0; i < 153; i++) {
		SendData(WF_PARTIAL[i]);
	}
	WaitUntilIdle();
}

/**
 *  @brief: basic function for sending commands
 */
void Epd2in66::SendCommand(unsigned char command) {
    DigitalWrite(dc_pin, 0);
    SpiTransfer(command);
}

/**
 *  @brief: basic function for sending data
 */
void Epd2in66::SendData(unsigned char data) {
    DigitalWrite(dc_pin, 1);
    SpiTransfer(data);
}

/**
 *  @brief: Wait until the busy_pin goes HIGH
 */
void Epd2in66::WaitUntilIdle(void) {
    while(DigitalRead(busy_pin) == 0) {      //0: busy, 1: idle
        //DelayMs(100);
    }
}

/**
 *  @brief: module reset.
 *          often used to awaken the module in deep sleep,
 *          see Epd2in66::Sleep();
 */
void Epd2in66::Reset(void) {
    DigitalWrite(reset_pin, 1);
    DelayMs(200);
    DigitalWrite(reset_pin, 0);                //module reset
    DelayMs(10);
    DigitalWrite(reset_pin, 1);
    DelayMs(200);
}

void Epd2in66::DisplayFrame(const unsigned char* frame_buffer_black, const unsigned char* frame_buffer_red) {
    UWORD Width, Height;
    Width = (width % 8 == 0)? (width / 8 ): (width / 8 + 1);
    Height = height;

    SendCommand(0x24);
    for (UWORD j = 0; j <Height; j++) {
        for (UWORD i = 0; i <Width; i++) {
            //SendData(0x00);
            SendData(~((~frame_buffer_black[i + j * Width]) | (~frame_buffer_red[i + j * Width])));
        }
    }

    TurnOnDisplay();

    WaitUntilIdle();
}

void Epd2in66::DisplayClear() {
    UWORD Width, Height;
    Width = (width % 8 == 0)? (width / 8 ): (width / 8 + 1);
    Height = height;
    SendCommand(0x24);
    for (UWORD j = 0; j <=Height; j++) {
        for (UWORD i = 0; i < Width; i++) {
            SendData(0xff);
        }
    }
    TurnOnDisplay();
}
/**
 *  @brief: After this command is transmitted, the chip would enter the
 *          deep-sleep mode to save power.
 *          The deep sleep mode would return to standby by hardware reset.
 *          The only one parameter is a check code, the command would be
 *          executed if check code = 0xA5.
 *          You can use Epd2in66::Init() to awaken
 */
void Epd2in66::Sleep() {
    SendCommand(0x10);         //power setting
    SendData(0x01);        //gate switch to external
    DelayMs(100);
}

/* END OF FILE */
