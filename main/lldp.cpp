#include "lldp.h"
#include "gatts_webble.h"
#include "epd.h"
#include "esp_event.h"
#include "esp_log.h"

static const char *TAG = "lldp";

void lldp_tlv_handler(const lldp_tlv *tlv) {
    switch (tlv->type) {
        case 0x00:
            epd_update();
        break;
        case 0x01:
            switch (tlv->data[0]) {
                case 0x04:
                    epd_setLine(1, "Chassis ID", "%02X:%02X:%02X:%02X:%02X:%02X",
                                tlv->data[1], tlv->data[2], tlv->data[3], tlv->data[4], tlv->data[5], tlv->data[6]);
                break;
                default:
                    epd_setLine(1, "Chassis ID", 10, (char*)tlv->data + 1, tlv->len - 1);
                break;
            }
        break;
        case 0x02:
            switch (tlv->data[0]) {
                case 0x03:
                    epd_setLine(2, "Port ID", "%02X:%02X:%02X:%02X:%02X:%02X",
                                tlv->data[1], tlv->data[2], tlv->data[3], tlv->data[4], tlv->data[5], tlv->data[6]);
                break;
                default:
                    epd_setLine(2, "Port ID", 7, (char*)tlv->data + 1, tlv->len - 1);
                break;
            }
        break;
        case 0x04:
            epd_setLine(2, "Port description", 16, (char*)tlv->data, tlv->len);
        break;
        case 0x05:
            epd_setLine(1, "System name", 11, (char*)tlv->data, tlv->len);
        break;
        case 0x7f: // Vendor specific
            switch ((tlv->data[0] << 24) + (tlv->data[1] << 16) + (tlv->data[2] << 8) + tlv->data[3]) {
                case 0x0080c201:
                    epd_setLine(3, "Port VLAN", "%u", (tlv->data[4] << 8) + tlv->data[5]);
                break;
            }
        break;
        default:
        break;
    }
}

void ethertype_lldp_handler(const eth_frame *frame) {
    ESP_LOGI(TAG, "Ethernet LLDP");
    ESP_LOG_BUFFER_HEXDUMP(TAG, frame->payload, frame->length, ESP_LOG_INFO);
    gatts_webble_set_and_notify_value(IDX_CHAR_VAL_LLDP, frame->length, frame->payload);
    lldp_tlv packet;
    packet.type = 1;
    uint8_t num_tlvs = 0;
    uint32_t currentOffset = 0;
    while(packet.type) {
        packet.type = frame->payload[currentOffset + 0] >> 1;
        packet.len = (frame->payload[currentOffset + 1] + frame->payload[currentOffset + 0] * 0x100) & 0x1FF;
        packet.data = &(frame->payload[currentOffset + 2]);
        currentOffset += 2 + packet.len;
        num_tlvs++;
        lldp_tlv_handler(&packet);
    }
}

void ethertype_lldp_reset() {
    uint8_t value[] = {0x00};
    gatts_webble_set_and_notify_value(IDX_CHAR_VAL_LLDP, sizeof(value), value);
    epd_clearLine(1);
    epd_clearLine(2);
    epd_clearLine(3);
}
