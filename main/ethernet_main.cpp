/* Ethernet Basic Example

   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
*/
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_eth.h"
#include "esp_event.h"
#include "esp_log.h"
#include "driver/gpio.h"
#include <driver/adc.h>
#include <esp_adc_cal.h>
#include "sdkconfig.h"

#include "ethernet.h"
#include "gatts_webble.h"
#include "epd.h"
#include "lldp.h"
#include "stp.h"
#include "vlan.h"

static const char *TAG = "eth_ble";

#define CONFIG_POWER_EXTERNAL_POWER_PIN 39
#define CONFIG_POWER_BATTERY_LEVEL_CHANNEL ADC1_CHANNEL_7
uint8_t eth_gatts_value[3] = {0x00, 0x00, 0x00};

#define BATT_V_MAX      2270.0
#define BATT_V_RANGE     636.0
#define BATT_V_MIN      1452.0

static bool power_event_handler() {
    adc1_config_width(ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(CONFIG_POWER_BATTERY_LEVEL_CHANNEL, ADC_ATTEN_DB_11);

    int val = adc1_get_raw(CONFIG_POWER_BATTERY_LEVEL_CHANNEL);
    val += adc1_get_raw(CONFIG_POWER_BATTERY_LEVEL_CHANNEL);
    val += adc1_get_raw(CONFIG_POWER_BATTERY_LEVEL_CHANNEL);
    val += adc1_get_raw(CONFIG_POWER_BATTERY_LEVEL_CHANNEL);
    val /= 4;
    float lvl = ((float)val - BATT_V_MIN) / BATT_V_RANGE;
    ESP_LOGI(TAG, "Battery Level: %d %f", val, lvl);
    epd_setIcon(epd_icon_battery, (uint8_t)(lvl / 0.25) + 1);
    eth_gatts_value[2] = (uint8_t)(lvl * 100.0);

    uint8_t power = gpio_get_level((gpio_num_t) CONFIG_POWER_EXTERNAL_POWER_PIN);
    //gatts_webble_set_and_notify_value(IDX_CHAR_VAL_ETH, sizeof(eth_gatts_value), eth_gatts_value);
    //if (power == eth_gatts_value[1]) return false;

    eth_gatts_value[1] = power;
    epd_setIcon(epd_icon_power, power);
    gatts_webble_set_and_notify_value(IDX_CHAR_VAL_ETH, sizeof(eth_gatts_value), eth_gatts_value);
    //epd_update();
    return !!power;
}

/** Event handler for Ethernet events */
static void eth_event_handler(void *arg, esp_event_base_t event_base,
                              int32_t event_id, void *event_data)
{
    uint8_t mac_addr[6] = {0};
    /* we can get the ethernet driver handle from event data */
    esp_eth_handle_t eth_handle = *(esp_eth_handle_t *)event_data;

    switch (event_id) {
    case ETHERNET_EVENT_CONNECTED:
        esp_eth_ioctl(eth_handle, ETH_CMD_G_MAC_ADDR, mac_addr);
        esp_eth_ioctl(eth_handle, ETH_CMD_S_PROMISCUOUS, (void *)true);
        ethertype_lldp_reset();
        ethertype_vlan_reset();
        ethertype_stp_reset();
        eth_gatts_value[0] = 0x04;
        epd_setIcon(epd_icon_ethernet, true);
        ESP_LOGI(TAG, "Ethernet Link Up");
        ESP_LOGI(TAG, "Ethernet HW Addr %02x:%02x:%02x:%02x:%02x:%02x",
                 mac_addr[0], mac_addr[1], mac_addr[2], mac_addr[3], mac_addr[4], mac_addr[5]);
    break;
    case ETHERNET_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "Ethernet Link Down");
        epd_setIcon(epd_icon_ethernet, false);
        eth_gatts_value[0] = 0x03;
    break;
    case ETHERNET_EVENT_START:
        ESP_LOGI(TAG, "Ethernet Started");
        epd_setIcon(epd_icon_ethernet, false);
        eth_gatts_value[0] = 0x02;
    break;
    case ETHERNET_EVENT_STOP:
        ESP_LOGI(TAG, "Ethernet Stopped");
        epd_setIcon(epd_icon_ethernet, false);
        eth_gatts_value[0] = 0x01;
    break;
    default:
    break;
    }
    power_event_handler();
    //epd_update();
    gatts_webble_set_and_notify_value(IDX_CHAR_VAL_ETH, sizeof(eth_gatts_value), eth_gatts_value);
}

static esp_err_t eth_frame_handler(esp_eth_handle_t eth_handle, uint8_t *buffer, uint32_t len, void* priv)
{
    assert(len >= sizeof(eth_frame));
    eth_frame frame;
    memcpy(&frame.dst, &(buffer[0]), 6);
    memcpy(&frame.src, &(buffer[6]), 6);
    frame.type = buffer[13] + buffer[12] * 0x100;
    frame.vlan = 0;
    frame.length = len - (6 + 6 + 2);
    frame.payload = &(buffer[14]);

    // ethernet I packet
    if (frame.type <= 0x05DC) {
        frame.length = frame.type;
        frame.type = 0;
        uint16_t sap = frame.payload[1] + frame.payload[0] * 0x100;
        switch (sap) {
            case 0x4242:
                frame.type = ETHERTYPE_STP;
                frame.payload = &(frame.payload[3]);
                frame.length -= 3;
            break;
            default:
            break;
        }
    }

    // strip vlan id from payload
    if (frame.type == ETHERTYPE_VLAN) {
        frame.vlan = (frame.payload[1] + frame.payload[0] * 0x100) & 0x0FFF;
        frame.type = frame.payload[3] + frame.payload[2] * 0x100;
        ethertype_vlan_handler(&frame);
        frame.payload = &(frame.payload[4]);
        frame.length -= 4;
    } else {
      ethertype_vlan_handler(&frame);
    }

    //ESP_LOGI(TAG, "core %d Got type %x", xPortGetCoreID(), frame.type);
    //ESP_LOGI(TAG, "Payload recv length %u", frame.length);
    switch (frame.type) {
        case ETHERTYPE_LLDP:
            ethertype_lldp_handler(&frame);
        break;
        case ETHERTYPE_STP:
            ethertype_stp_handler(&frame);
        break;
        default:
        break;
    }

    free(buffer);
    return ESP_OK;
}

static void paint_event_schedule(void) {
    while(true) {
        epd_update();
        vTaskDelay( pdMS_TO_TICKS( 2 * 1000 ) );
    }
}
static void power_event_schedule(void) {
    while(true) {
        power_event_handler();
        vTaskDelay( pdMS_TO_TICKS( 30 * 1000 ) );
    }
}

extern "C" void app_main(void)
{
    // Create default event loop that running in background
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    ESP_ERROR_CHECK(esp_event_handler_register(ETH_EVENT, ESP_EVENT_ANY_ID, &eth_event_handler, NULL));

    epd_init();
    ESP_ERROR_CHECK(gatts_webble_init());

    // setup external power sense
    gpio_set_intr_type((gpio_num_t) CONFIG_POWER_EXTERNAL_POWER_PIN, GPIO_INTR_ANYEDGE);
    gpio_set_direction((gpio_num_t) CONFIG_POWER_EXTERNAL_POWER_PIN, GPIO_MODE_INPUT);

    vTaskDelay(pdMS_TO_TICKS(200));

    eth_mac_config_t mac_config = ETH_MAC_DEFAULT_CONFIG();
    eth_phy_config_t phy_config = ETH_PHY_DEFAULT_CONFIG();
    phy_config.phy_addr = CONFIG_ETHERNET_ETH_PHY_ADDR;
    phy_config.reset_gpio_num = CONFIG_ETHERNET_ETH_PHY_RST_GPIO;
    gpio_pad_select_gpio((gpio_num_t) CONFIG_ETHERNET_ETH_PHY_PWR_GPIO);
    gpio_set_direction((gpio_num_t) CONFIG_ETHERNET_ETH_PHY_PWR_GPIO,GPIO_MODE_OUTPUT);
    gpio_set_level((gpio_num_t) CONFIG_ETHERNET_ETH_PHY_PWR_GPIO, 1);
    vTaskDelay(pdMS_TO_TICKS(10));
#if CONFIG_ETHERNET_USE_INTERNAL_ETHERNET
    mac_config.smi_mdc_gpio_num = CONFIG_ETHERNET_ETH_MDC_GPIO;
    mac_config.smi_mdio_gpio_num = CONFIG_ETHERNET_ETH_MDIO_GPIO;
    esp_eth_mac_t *mac = esp_eth_mac_new_esp32(&mac_config);
#if CONFIG_ETHERNET_ETH_PHY_IP101
    esp_eth_phy_t *phy = esp_eth_phy_new_ip101(&phy_config);
#elif CONFIG_ETHERNET_ETH_PHY_RTL8201
    esp_eth_phy_t *phy = esp_eth_phy_new_rtl8201(&phy_config);
#elif CONFIG_ETHERNET_ETH_PHY_LAN8720
    esp_eth_phy_t *phy = esp_eth_phy_new_lan8720(&phy_config);
#elif CONFIG_ETHERNET_ETH_PHY_DP83848
    esp_eth_phy_t *phy = esp_eth_phy_new_dp83848(&phy_config);
#endif
#elif CONFIG_ETHERNET_USE_DM9051
    gpio_install_isr_service(0);
    spi_device_handle_t spi_handle = NULL;
    spi_bus_config_t buscfg = {
        .miso_io_num = CONFIG_ETHERNET_DM9051_MISO_GPIO,
        .mosi_io_num = CONFIG_ETHERNET_DM9051_MOSI_GPIO,
        .sclk_io_num = CONFIG_ETHERNET_DM9051_SCLK_GPIO,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
    };
    ESP_ERROR_CHECK(spi_bus_initialize(CONFIG_ETHERNET_DM9051_SPI_HOST, &buscfg, 1));
    spi_device_interface_config_t devcfg = {
        .command_bits = 1,
        .address_bits = 7,
        .mode = 0,
        .clock_speed_hz = CONFIG_ETHERNET_DM9051_SPI_CLOCK_MHZ * 1000 * 1000,
        .spics_io_num = CONFIG_ETHERNET_DM9051_CS_GPIO,
        .queue_size = 20
    };
    ESP_ERROR_CHECK(spi_bus_add_device(CONFIG_ETHERNET_DM9051_SPI_HOST, &devcfg, &spi_handle));
    /* dm9051 ethernet driver is based on spi driver */
    eth_dm9051_config_t dm9051_config = ETH_DM9051_DEFAULT_CONFIG(spi_handle);
    dm9051_config.int_gpio_num = CONFIG_ETHERNET_DM9051_INT_GPIO;
    esp_eth_mac_t *mac = esp_eth_mac_new_dm9051(&dm9051_config, &mac_config);
    esp_eth_phy_t *phy = esp_eth_phy_new_dm9051(&phy_config);
#endif
    esp_eth_config_t config = ETH_DEFAULT_CONFIG(mac, phy);
    config.stack_input = eth_frame_handler;
    esp_eth_handle_t eth_handle = NULL;
    ESP_ERROR_CHECK(esp_eth_driver_install(&config, &eth_handle));
    /* start Ethernet driver state machine */
    ESP_ERROR_CHECK(esp_eth_start(eth_handle));

    static uint8_t ucParameterToPass;
    TaskHandle_t powerHandle = NULL;
    TaskHandle_t paintHandle = NULL;
    xTaskCreate( (TaskFunction_t)power_event_schedule, "power_schedule", 4096, &ucParameterToPass, tskIDLE_PRIORITY, &powerHandle );
    xTaskCreate( (TaskFunction_t)paint_event_schedule, "paint_schedule", 4096, &ucParameterToPass, tskIDLE_PRIORITY, &paintHandle );
}
