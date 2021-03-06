
#ifndef ETHERNET_H
#define ETHERNET_H

#include <stdio.h>
#include <stdlib.h>

#define ETHERTYPE_VLAN 0x8100
#define ETHERTYPE_LLDP 0x88cc

typedef struct {
   uint8_t dst[6];
   uint8_t src[6];
   uint16_t type;
   uint16_t vlan;
   uint16_t length;
   uint8_t* payload;
} eth_frame;


#endif
