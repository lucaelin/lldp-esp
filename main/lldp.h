
#ifndef LLDP_H
#define LLDP_H

#include <stdio.h>
#include <stdlib.h>
#include "ethernet.h"

typedef struct {
   uint16_t type;
   uint16_t len;
   uint8_t* data;
} lldp_tlv;

/* 1. Chassis ID
  1. entPhysicalAlias for chassis
  2. ifAlias for an interface
  3. entPhysicalAlias for port or backplane
  4. MAC address for the system
  5. A management address for the system
*/
/* 2. Port ID
  1. ifAlias for the source port
  2. entPhysicalAlias for the port
  3. MAC address for the port
  4. A management address for the port

  7. Locally assigned
*/
/* 3. Time To Live */
/* 4.	Port description */
/* 5.	System name */
/* 6.	System description */
/* 7.	System capabilities */
/* 8. Management address */
/* 9.-126. Reserved */
/* 127. Vendor Specific */
/*
Port VLAN ID TLV (OUI = 00-80-c2, Subtype = 1)
Port And Protocol VLAN ID TLV (OUI = 00-80-c2, Subtype = 2)
VLAN Name TLV (OUI = 00-80-c2, Subtype = 3)
Protocol Identity (OUI = 00-80-c2, Subtype = 4)
VID Usage Digest (OUI = 00-80-c2, Subtype = 5)
Management VID (OUI = 00-80-c2, Subtype = 6)
Link Aggregation (OUI = 00-80-c2, Subtype = 7)
Congestion Notification (OUI = 00-80-c2, Subtype = 8)
ETS Configuration TLV (OUI = 00-80-c2, Subtype = 9)
ETS Recommendation TLV (OUI = 00-80-c2, Subtype = A)
Priority-based Flow Control Configuration TLV (OUI = 00-80-c2, Subtype = B )
Application Priority TLV (OUI = 00-80-c2, Subtype = C)
EVB TLV (OUI = 00-80-c2, Subtype = D)
CDCP TLV (OUI = 00-80-c2, Subtype = E)
Port extension TLV (OUI = 00-80-c2, Subtype = F)
*/

void lldp_tlv_handler(const lldp_tlv *tlv);
void ethertype_lldp_handler(const eth_frame *frame);
void ethertype_lldp_reset();

#endif
