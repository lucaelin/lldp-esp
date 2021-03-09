import {html, render} from 'https://unpkg.com/lit-html?module';
import {connectDevice, watchCharacteristic} from './ble.js';
import tile from './tile.js';

import ethUi from './ui/eth.js';
import lldpUi from './ui/lldp.js';

const bleService = 0x00FF;
const bleUi = createElement('BLE');
const characteristics = [ethUi, lldpUi].map(c=>({
  ...c,
  value: typeof c.uuid === 'object' ?
    Object.fromEntries(Object.entries(c.uuid).map(([k,v])=>
      [k,new DataView(new ArrayBuffer(0))]
    )) : new DataView(new ArrayBuffer(0)),
  lastChange: null,
  dom: createElement(),
}));
const helpUi = createElement('HELP');

async function connect() {
  setBleStatus('connecting...', 'unknown');
  const device = await connectDevice(bleService).catch(e=>{
    setBleStatus('failed!', 'bad');
    window.setTimeout(()=>{
      setBleStatus('connect', 'ok', connect);
    }, 1500)
  });
  if (!device) return;
  setBleStatus('connected', 'good');
  device.addEventListener('gattserverdisconnected', ()=>setBleStatus('disconnected', 'bad'));
  device.addEventListener('gattserverconnected', ()=>setBleStatus('connected', 'good'));
}

function setBleStatus(status, okness='unknown', fx=()=>window.location.reload()) {
  render(tile('BLE', status, okness, fx), bleUi);
}
const helptext = html`
  <h2>Where am I?</h2>
  <p>The esp-lldp tool is a webapp that works in combination with an ESP32 with onboard ethernet and is useful for debugging or configuring network equipment.<br />
  Its purpose is to passively listen on ethernet traffic and extract information about the switch it is connected to.<br />
  If the connected equipment is sending LLDP messages, those are parsed and shown here, too.</p>
  <h2>How do I connect?</h2>
  <p>Once your ESP is up and running, you can use the "connect" button above. You'll see a list of Bluetooth-devices. Choose your device and click pair.</p>
  <h2>What can I see after connecting?</h2>
  <p>You will be shown information about: <ul>
    <li>Bluetooth connectivity status</li>
    <li>Ethernet connectivity status</li>
    <li>LLDP status and information</li>
    <li>Detected VLANs</li>
  </ul></p>
`;
const bleunavailable = html`
  <pre>Web Bluetooth is unavailable on your system or browser.
  Apple decided against implementing this API - Mozilla followed.
  Google Chrome, Edge (Chromium) and Opera should work fine, if the device has BLE capabilities.</pre>
`;
async function init() {
  render(tile('HELP', '?', 'unknown', helptext), helpUi);

  characteristics.forEach(c=>{
    if (typeof c.uuid === 'object') {
      c.value = {};
      Object.entries(c.uuid).forEach(([name, uuid])=>{
        c.value[name] = new DataView(new ArrayBuffer(0));
        watchCharacteristic(uuid, (value, isNotify)=>{
          if (isNotify) c.lastChange = new Date();
          c.value[name] = value;
          render(c.update(c), c.dom);
        })
      })
    } else {
      c.value = new DataView(new ArrayBuffer(0));
      watchCharacteristic(c.uuid, (value, isNotify)=>{
        if (isNotify) c.lastChange = new Date();
        c.value = value;
        render(c.update(c), c.dom);
      })
    }
  });
  const isBluetoothAvailable = navigator.bluetooth ? await navigator.bluetooth.getAvailability() : false;

  if (isBluetoothAvailable) {
    setBleStatus('connect', 'ok', connect);
  } else {
    setBleStatus('unavailable', 'bad', bleunavailable);
  }
}

function createElement(name) {
  const dom = document.createElement('div');
  document.querySelector('main').appendChild(dom);
  return dom;
}

init();
