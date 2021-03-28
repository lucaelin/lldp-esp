/**
 *  @filename   :   epd1in54-demo.ino
 *  @brief      :   1.54inch e-paper display demo
 *  @author     :   Yehui from Waveshare
 *
 *  Copyright (C) Waveshare     September 5 2017
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
#include "epd.h"

#include "epd2in66.h"
#include "epdpaint.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/timer.h"
#include "fonts.h"
#include <algorithm>

#define COLORED     1
#define UNCOLORED   0

static const char *TAG = "EPD";

Epd epd;
bool init_complete = false;
bool schedule_update = false;
int64_t last_update = -1 * EPD_REFRESH_TIMEOUT * 1000;

unsigned char* frame_black = (unsigned char*)malloc(epd.width * epd.height / 8);
unsigned char* frame_red = (unsigned char*)malloc(epd.width * epd.height / 8);

Paint paint_black(frame_black, epd.width, epd.height);
Paint paint_red(frame_red, epd.width, epd.height);

const uint8_t len_of_keyval = 20;
const uint32_t keyval_buffer = epd_num_lines * len_of_keyval;

char old_keys[keyval_buffer] = {};
char old_values[keyval_buffer] = {};
uint8_t old_icons[epd_num_icons] = {};
char keys[keyval_buffer] = {};
char values[keyval_buffer] = {};
uint8_t icons[epd_num_icons] = {};

bool bufferChanged() {
    for (uint32_t i = 0; i < keyval_buffer; i++) {
        if (old_keys[i] != keys[i]) return true;
        if (old_values[i] != values[i]) return true;
    }
    for (uint8_t i = 0; i < epd_num_icons; i++) {
        if (old_icons[i] != icons[i]) return true;
    }
    return false;
}

const uint64_t* epd_getIcon(epd_icon icon, uint8_t value) {
    switch(icon) {
        case epd_icon_ble:      return icon_ble;
        case epd_icon_ethernet: return icon_ethernet;
        case epd_icon_power:    return icon_power;
        case epd_icon_battery:  switch(value) {
            case 06: return icon_battery4;
            case 05: return icon_battery4;
            case 04: return icon_battery3;
            case 03: return icon_battery2;
            case 02: return icon_battery1;
            case 01: return icon_battery0;
            default: return icon_none;
        }

        case epd_num_icons:     return icon_none;
    }
    return icon_none;
}

void epd_update() {
    if (!init_complete) epd_init();
    ESP_LOGI(TAG, "Draw started");
    int64_t time = esp_timer_get_time();

    if (time < last_update + 5 * 1000 * 1000) {
        ESP_LOGI(TAG, "Draw too frequenly");
        if (schedule_update) return;
        ESP_LOGI(TAG, "Creating draw schedule");
        schedule_update = true;
        vTaskDelay(EPD_REFRESH_TIMEOUT / portTICK_PERIOD_MS);
        ESP_LOGI(TAG, "Resuming draw schedule");
        return epd_update();
    }
    if (!bufferChanged() && !schedule_update) {
        ESP_LOGI(TAG, "Draw not required");
        return;
    }

    schedule_update = true;
    last_update = time;

    ESP_LOGI(TAG, "Draw sleeping a little");
    // epapers are slow, so lets wait another two second because update requests might come in packs
    vTaskDelay(2000 / portTICK_PERIOD_MS);
    ESP_LOGI(TAG, "Draw actually starting now");

    schedule_update = false;


    memcpy(old_keys, keys, keyval_buffer);
    memcpy(old_values, values, keyval_buffer);
    memcpy(old_icons, icons, epd_num_icons);

    paint_black.Clear(UNCOLORED);
    paint_red.Clear(UNCOLORED);

    paint_black.DrawImageAt(epd.width - 58, epd.height - 58, icon_logo, 58, 58);

    for (uint8_t icon = 0; icon < epd_num_icons; icon++) {
        if (old_icons[icon]) {
            paint_black.DrawImageAt( icon * 30, epd.height - 32, epd_getIcon((epd_icon) icon, old_icons[icon]), 32, 32);
        }
    }

    uint8_t blockheight = Font12.Height + Font16.Height;

    for (uint8_t line = 0; line < epd_num_lines; line++) {
        uint32_t idx = line * len_of_keyval;

        paint_black.DrawStringBufferAt(4, 8 + blockheight * line, &old_keys[idx], len_of_keyval, &Font12, COLORED);
        paint_red.DrawStringBufferAt(8, 8 + Font12.Height + blockheight * line, &old_values[idx], len_of_keyval, &Font16, COLORED);
    }

    epd.DisplayFrame(frame_black, frame_red);
    ESP_LOGI(TAG, "Draw complete");
}

void epd_clearLines() {
    for (uint8_t line = 0; line < epd_num_lines; line++) {
        epd_clearLine((epd_line) line);
    }
}
void epd_clearLine(epd_line line) {
    uint32_t offset = len_of_keyval * line;
    for (uint32_t idx = offset; idx < offset + len_of_keyval; idx++) {
        keys[idx] = ' ';
        values[idx] = ' ';
    }
}

void epd_setLine(epd_line line, const char *key, uint32_t keyLength, const char *value, uint32_t valLength) {
    uint32_t offset = len_of_keyval * line;
    epd_clearLine(line);
    memcpy(keys + offset, key, std::min((uint8_t) keyLength, len_of_keyval));
    memcpy(values + offset, value, std::min((uint8_t) valLength, len_of_keyval));
}

void epd_setLine(epd_line line, const char *key, const char *value, ...) {
    uint32_t offset = len_of_keyval * line;
    epd_clearLine(line);

    uint32_t len = snprintf(keys + offset, len_of_keyval, "%s", key);
    if (len < len_of_keyval) keys[offset + len] = ' ';

    va_list args;
    va_start(args, value);

    len = vsnprintf(values + offset, len_of_keyval, value, args);
    if (len < len_of_keyval) values[offset + len] = ' ';

    va_end(args);
}

void epd_setIcon(epd_icon icon, uint8_t show) {
    icons[icon] = show;
}

void epd_init() {
  if (epd.Init() != 0) {
      ESP_LOGE(TAG, "e-Paper init failed");
      return;
  }
  ESP_LOGI(TAG, "e-Paper initialized");

/*
  paint_black.Clear(UNCOLORED);
  paint_red.Clear(UNCOLORED);

  paint_black.DrawRectangle(10, 60, 50, 110, COLORED);
  paint_black.DrawLine(10, 60, 50, 110, COLORED);
  paint_black.DrawLine(50, 60, 10, 110, COLORED);
  paint_black.DrawCircle(120, 80, 30, COLORED);
  paint_red.DrawFilledRectangle(10, 130, 50, 180, COLORED);
  paint_red.DrawFilledRectangle(0, 6, 200, 26, COLORED);
  paint_red.DrawFilledCircle(120, 150, 30, COLORED);

  paint_black.DrawStringAt(30, 30, "e-Paper Demo", &Font12, COLORED);
  paint_red.DrawStringAt(28, 10, "Hello world!", &Font12, UNCOLORED);

  // Display the frame buffer
  epd.DisplayFrame(frame_black, frame_red);
*/

  epd_clearLines();

  init_complete = true;
  //epd_update();
}
