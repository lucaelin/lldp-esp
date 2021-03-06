
#ifndef EPD_LLDP_H
#define EPD_LLDP_H

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>

void epd_setLine(uint8_t line, const char *key, uint32_t keyLength, const char *value, uint32_t valLength);
void epd_setLine(uint8_t line, const char *key, const char *value, ...);
void epd_clearLines();
void epd_clearLine(uint8_t line);
void epd_update();
void epd_init();

static const uint64_t epd_logo[] = {
  0b1111111111111100001100000000110000001111000011111111111111,
  0b1111111111111100001100000000110000001111000011111111111111,
  0b1100000000001100110011000011000000000011110011000000000011,
  0b1100000000001100110011000011000000000011110011000000000011,
  0b1100111111001100000011001100001100001100000011001111110011,
  0b1100111111001100000011001100001100001100000011001111110011,
  0b1100111111001100000000110011000000000011110011001111110011,
  0b1100111111001100000000110011000000000011110011001111110011,
  0b1100111111001100111100111111000011111111000011001111110011,
  0b1100111111001100111100111111000011111111000011001111110011,
  0b1100000000001100001100000000111100001111000011000000000011,
  0b1100000000001100001100000000111100001111000011000000000011,
  0b1111111111111100110011001100110011001100110011111111111111,
  0b1111111111111100110011001100110011001100110011111111111111,
  0b0000000000000000001111110000001100110011000000000000000000,
  0b0000000000000000001111110000001100110011000000000000000000,
  0b1100110011001100000011110000000000110011110000001100001100,
  0b1100110011001100000011110000000000110011110000001100001100,
  0b1111001111110011110011000011000011000000111111000011000011,
  0b1111001111110011110011000011000011000000111111000011000011,
  0b0011111100001100000000000000110000001100111111111100111111,
  0b0011111100001100000000000000110000001100111111111100111111,
  0b1100001100110011001111110011110000111111110000110000001100,
  0b1100001100110011001111110011110000111111110000110000001100,
  0b1111111100001111111100110000110000110000001111000011001111,
  0b1111111100001111111100110000110000110000001111000011001111,
  0b1100000000110000111100000000110011000000111111000011000011,
  0b1100000000110000111100000000110011000000111111000011000011,
  0b0011000000111100110000110011000000110000001100110011001111,
  0b0011000000111100110000110011000000110000001100110011001111,
  0b0000000011000011110000111100001111111111001100110011001100,
  0b0000000011000011110000111100001111111111001100110011001100,
  0b1111001100001111000011001100000011111111111111000011001111,
  0b1111001100001111000011001100000011111111111111000011001111,
  0b0011001111110000110011110011000011000000111111000011110011,
  0b0011001111110000110011110011000011000000111111000011110011,
  0b1100001100111111000000110000110000110000000000111100001111,
  0b1100001100111111000000110000110000110000000000111100001111,
  0b0011000000000011111111001111111111111100110000000011001100,
  0b0011000000000011111111001111111111111100110000000011001100,
  0b1100111100001111000000111100111111110000111111111100000000,
  0b1100111100001111000000111100111111110000111111111100000000,
  0b0000000000000000110011110000110000000011110000001100111111,
  0b0000000000000000110011110000110000000011110000001100111111,
  0b1111111111111100000011000011000011000011110011001111001111,
  0b1111111111111100000011000011000011000011110011001111001111,
  0b1100000000001100000011000000001100110000110000001111000011,
  0b1100000000001100000011000000001100110000110000001111000011,
  0b1100111111001100110011111100000000110000111111111100000011,
  0b1100111111001100110011111100000000110000111111111100000011,
  0b1100111111001100000000111111000011000011110000001100111111,
  0b1100111111001100000000111111000011000011110000001100111111,
  0b1100111111001100111111000011110011000011000000111111000011,
  0b1100111111001100111111000011110011000011000000111111000011,
  0b1100000000001100001100110000001111110011110011110000001100,
  0b1100000000001100001100110000001111110011110011110000001100,
  0b1111111111111100111111000011110011110000110000110000001111,
  0b1111111111111100111111000011110011110000110000110000001111
};


#endif
