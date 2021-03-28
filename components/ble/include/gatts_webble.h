/*
   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
*/

#define COMPONENTS_MY_BLE_H_

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "esp_event.h"


/* Attributes State Machine */
typedef enum
{
    IDX_SVC,
    IDX_CHAR_ETH,
    IDX_CHAR_VAL_ETH,
    IDX_CHAR_CFG_ETH,

    IDX_CHAR_LLDP,
    IDX_CHAR_VAL_LLDP,
    IDX_CHAR_CFG_LLDP,

    IDX_CHAR_VLAN,
    IDX_CHAR_VAL_VLAN,
    IDX_CHAR_CFG_VLAN,

    IDX_CHAR_STP,
    IDX_CHAR_VAL_STP,
    IDX_CHAR_CFG_STP,

    IDX_NB,
} gatts_webble_idx;

#ifdef __cplusplus
extern "C" {
#endif
    esp_err_t gatts_webble_init();
    esp_err_t gatts_webble_set_value(gatts_webble_idx idx, uint16_t length, uint8_t *value);
    esp_err_t gatts_webble_get_value(gatts_webble_idx idx, uint16_t *length, const uint8_t **value);
    esp_err_t gatts_webble_notify_value(gatts_webble_idx idx, uint16_t length, uint8_t *value);
    esp_err_t gatts_webble_set_and_notify_value(gatts_webble_idx idx, uint16_t length, uint8_t *value);
#ifdef __cplusplus
}
#endif
