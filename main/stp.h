
#ifndef STP_H
#define STP_H

#include <stdio.h>
#include <stdlib.h>
#include "ethernet.h"

void ethertype_stp_handler(const eth_frame *frame);
void ethertype_stp_reset();

#endif
