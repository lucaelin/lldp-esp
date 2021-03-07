# LLDP-ESP
The LLDP-ESP tool is a ESP32-Firmware and WebApp useful for **debugging or configuring network equipment**.

Its purpose is to passively listen on ethernet traffic and extract information about the switch it is connected to.

If the connected equipment is sending **LLDP** messages, those are parsed and displayed, too.

## Hardware
I designed this software to run on the [Olimex **ESP32**-POE-ISO](https://www.olimex.com/Products/IoT/ESP32/ESP32-POE-ISO/). This SoC includes an ESP32-WROOM-32, a 100Mbit/s Ethernet interface and can be powered using PoE, USB or an external battery.

On the far side of the network, I tested **Ubiquity Unifi** devices and Servers running **lldpd**. If you have different Vendors to test with feel free to file an issue (even if they just work).

To display information extracted by the controller, I built a webapp to run on my Laptop or **Android** Phone (no iOS support, but I used an iPhone to take pictures of my Android).

The firmware now also supports the [Waveshare Black/Red 1.54inch **E-Ink display** (rev2.1)](https://www.waveshare.com/1.54inch-e-paper-module-b.htm) using SPI to show a condensed set of information directly on the device.

Both the ethernet driver as well as SPI pinout can be configured using `idf.py menuconfig`. If you need more config options or confirm compatibility with different hardware, feel free to file an issue.

## Getting started
Download the repository and setup your esp-idf build environment. You can use `idf.py menuconfig` to configure the ethernet or epaper setup.
Next, use `idf.py -p <your_serial_esp_device> build flash monitor` to load the firmware onto your device.

Once your ESP is up and running, use your browser to navigate to https://lucaelin.github.io/lldp-esp

You can now use the "connect" button at the top. You'll see a list of Bluetooth-devices. Choose your device and click pair.

*Hint:* You can use Chromes "Add to Homescreen"-feature to create a native look'n'feel on Android

## What can I see after connecting?
You will be shown information about:
- Bluetooth connectivity status
- Ethernet connectivity status
- LLDP status and information (if advertised), like
    - Name of the switch
    - Port on the switch
    - VLANs the port is configured for
    - and more
- Detected VLANs

## Technologies and software used
- [Espressif ESP-IDF](https://github.com/espressif/esp-idf) and their ESP32 platform
- [Olimex Ethernet example code](https://github.com/OLIMEX/ESP32-POE/tree/master/SOFTWARE/ESP-IDF/ESP32_PoE_Ethernet_IDFv4.2) adapted to run in promiscuous mode
- [ESP Bluetooth LE example code](https://github.com/espressif/esp-idf/tree/master/examples/bluetooth/bluedroid/ble/gatt_server_service_table) adapted to play nice with WebBLE
- [Ayoy ESP-IDF code for the Waveshare module](https://github.com/ayoy/esp32-waveshare-epd) adapted to work with Rev2.1
- [LLDP](https://www.juniper.net/documentation/en_US/junos/topics/concept/layer-2-services-lldp-overview.html) (Link Layer Discovery Protocol)
- [Web Bluetooth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) on Google Chrome
- [lit-html](https://lit-html.polymer-project.org/) to ease rendering the Web-UI

## Ideas ahead
- Add more LLDP information
- 3D-Printed case
- Find more ways to gather information if LLDP is unavailable
- Support more / other ePaper-Modules
- Improve GATTS server code to make it easier to extend
- Add offline-support to the webclient
- Wrap webclient into native App to support iOS
