#include "vlan.h"
#include "gatts_webble.h"
#include "epd.h"
#include "esp_log.h"

static const char *TAG = "vlan";

#define GetBit(var, bit) (((var) & (1 << (bit))) != 0)
#define SetBit(var, bit) ((var) |= (1 << (bit)))
#define FlipBit(var, bit) ((var) ^= (1 << (bit)))
#define ClearBit(var, bit) ((var) &= ~(1 << (bit)))

uint8_t vlan_id_seen[4096] = {};
uint16_t num_vlan_id_seen = 0;

uint8_t* list_vlan_id_seen() {
    uint8_t* vlan_list = (uint8_t*) malloc(num_vlan_id_seen * sizeof(uint16_t) + num_vlan_id_seen * sizeof(uint8_t));
    uint16_t idx = 0;
    for (uint16_t i = 0; i < 4096; i++) {
        if (vlan_id_seen[i]) {
            vlan_list[idx*3] = i >> 8;
            vlan_list[idx*3+1] = i;
            vlan_list[idx*3+2] = vlan_id_seen[i];
            idx++;
        }
    }
    return vlan_list;
}

void ethertype_vlan_handler(const eth_frame *frame) {
    uint8_t old_value = vlan_id_seen[frame->vlan];

    if (!vlan_id_seen[frame->vlan]) {
        ESP_LOGI(TAG, "New ethernet VLAN %u", frame->vlan);
        SetBit(vlan_id_seen[frame->vlan], 0);
        num_vlan_id_seen++;
    }

    switch (frame->type) {
        case ETHERTYPE_ARP:
            SetBit(vlan_id_seen[frame->vlan], 1);
        break;
        case ETHERTYPE_IPV4:
            SetBit(vlan_id_seen[frame->vlan], 2);
        break;
        case ETHERTYPE_IPV6:
            SetBit(vlan_id_seen[frame->vlan], 3);
        break;
        case ETHERTYPE_ETHERNET: // most likely STP anyway
        break;
        case ETHERTYPE_LLDP:
        break;
        case ETHERTYPE_STP:
        break;
        default:
            ESP_LOGI(TAG, "Unknown ethertype %02X", frame->type);
            SetBit(vlan_id_seen[frame->vlan], 7);
        break;
    }

    if (old_value != vlan_id_seen[frame->vlan]) {
        uint8_t* vlan_list = list_vlan_id_seen();
        ESP_LOG_BUFFER_HEXDUMP(TAG, vlan_list, num_vlan_id_seen * 3, ESP_LOG_INFO);
        gatts_webble_set_and_notify_value(IDX_CHAR_VAL_VLAN, num_vlan_id_seen * 3, (uint8_t*)vlan_list);
        free(vlan_list);
    }
}

void ethertype_vlan_reset() {
    for (uint32_t i = 0; i < sizeof(vlan_id_seen); i++)
        vlan_id_seen[i] = 0;
    num_vlan_id_seen = 0;

    uint8_t reset[] = {0};
    gatts_webble_set_and_notify_value(IDX_CHAR_VAL_VLAN, sizeof(uint8_t), reset);
}
