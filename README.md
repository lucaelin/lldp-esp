# LLDP-ESP
The esp-lldp tool is a webapp that works in combination with an ESP32 with onboard ethernet and is useful for debugging or configuring network equipment.

Its purpose is to passively listen on ethernet traffic and extract information about the switch it is connected to.

If the connected equipment is sending LLDP messages, those are parsed and displayed, too.

## Getting started
Download the repository and setup your esp-idf build environment. You can use `idf.py menuconfig` to configure ethernet or epaper setup.
Next, use `idf.py -p <your_serial_esp_device> build flash monitor` to load the firmware onto your device.

Once your ESP is up and running, use your browser to navigate to https://lucaelin.github.io/lldp-esp

You can now use the "connect" button at the top. You'll see a list of Bluetooth-devices. Choose your device and click pair.

## What can I see after connecting?
You will be shown information about:
  - Bluetooth connectivity status
  - Ethernet connectivity status
  - LLDP status and information
  - Detected VLANs
