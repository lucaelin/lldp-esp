#include "vlan.h"
#include "gatts_webble.h"
#include "epd.h"
#include "esp_log.h"

static const char *TAG = "vlan";

#define GetBit(var, bit) ((var[bit / 8] & (1 << (bit % 8))) != 0)
#define SetBit(var, bit) (var[bit / 8] |= (1 << (bit % 8)))
#define FlipBit(var, bit) (var[bit / 8] ^= (1 << (bit % 8)))
#define ClearBit(var, bit) (var[bit / 8] &= ~(1 << (bit % 8)))
uint8_t vlan_id_seen[4096 / 8] = {};
uint16_t num_vlan_id_seen = 0;

uint8_t* list_vlan_id_seen() {
    uint8_t* vlan_list = (uint8_t*)malloc(num_vlan_id_seen * sizeof(uint16_t));
    uint16_t idx = 0;
    for (uint16_t i = 0; i < 4096; i++) {
        if (GetBit(vlan_id_seen, i)) {
            vlan_list[idx*2] = i >> 8;
            vlan_list[idx*2+1] = i;
            idx++;
        }
    }
    return vlan_list;
}

void ethertype_vlan_handler(const eth_frame *frame) {
    if (!GetBit(vlan_id_seen, frame->vlan)) {
        ESP_LOGI(TAG, "New ethernet VLAN %u", frame->vlan);
        SetBit(vlan_id_seen, frame->vlan);
        num_vlan_id_seen++;

        uint8_t* vlan_list = list_vlan_id_seen();
        ESP_LOG_BUFFER_HEXDUMP(TAG, vlan_list, num_vlan_id_seen * sizeof(uint16_t), ESP_LOG_INFO);
        gatts_webble_set_and_notify_value(IDX_CHAR_VAL_VLAN, num_vlan_id_seen * sizeof(uint16_t), (uint8_t*)vlan_list);
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
