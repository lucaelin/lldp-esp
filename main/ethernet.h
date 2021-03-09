
#ifndef ETHERNET_H
#define ETHERNET_H

#include <stdio.h>
#include <stdlib.h>

#define ETHERTYPE_ETHERNET 0x00
#define ETHERTYPE_VLAN 0x8100
#define ETHERTYPE_LLDP 0x88cc
#define ETHERTYPE_STP 0x8181
#define ETHERTYPE_IPV4 0x0800
#define ETHERTYPE_IPV6 0x86DD
#define ETHERTYPE_ARP 0x0806

typedef struct {
   uint8_t dst[6];
   uint8_t src[6];
   uint16_t type;
   uint16_t vlan;
   uint16_t length;
   uint8_t* payload;
} eth_frame;


#endif
