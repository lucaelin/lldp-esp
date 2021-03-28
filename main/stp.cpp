#include "stp.h"
#include "gatts_webble.h"
#include "epd.h"
#include "esp_event.h"
#include "esp_log.h"

static const char *TAG = "stp";

eth_frame last_stp_frame;

void ethertype_stp_handler(const eth_frame *frame) {
    ESP_LOGI(TAG, "Ethernet STP");

    if (last_stp_frame.length == frame->length) {
        if (!memcmp(last_stp_frame.payload, frame->payload, last_stp_frame.length)) return;
    }

    ESP_LOG_BUFFER_HEXDUMP(TAG, frame->payload, frame->length, ESP_LOG_INFO);

    free(last_stp_frame.payload);
    last_stp_frame.length = frame->length;
    last_stp_frame.payload = (uint8_t*) malloc(frame->length);
    memcpy(last_stp_frame.payload, frame->payload, frame->length);

    gatts_webble_set_and_notify_value(IDX_CHAR_VAL_STP, frame->length, frame->payload);

    if (frame->length < 36) return;

    uint8_t* bridge = &(last_stp_frame.payload[19]);
    epd_setLine(epd_line_stpbridge, "STP Bridge", "%02X%02X%02X%02X%02X%02X",
                bridge[1], bridge[2], bridge[3], bridge[4], bridge[5], bridge[6]);

    uint8_t portID = last_stp_frame.payload[26] + (last_stp_frame.payload[27] & 0x0F) * 0x100;
    epd_setLine(epd_line_stpport, "STP Port", "%d", portID);
}

void ethertype_stp_reset() {
    uint8_t value[] = {0x00};
    last_stp_frame.length = 0;
    gatts_webble_set_and_notify_value(IDX_CHAR_VAL_STP, sizeof(value), value);
}
