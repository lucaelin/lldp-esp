
#ifndef VLAN_H
#define VLAN_H

#include <stdio.h>
#include <stdlib.h>
#include "ethernet.h"

void ethertype_vlan_handler(const eth_frame *frame);
void ethertype_vlan_reset();

#endif
