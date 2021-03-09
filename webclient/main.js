import {html, render} from 'https://unpkg.com/lit-html?module';
import {connectDevice, watchCharacteristic} from './ble.js';
import {parseLLDP} from './lldp.js'

const bleUi = createElement('BLE');
const serviceUuid = 0x00ff;
const characteristics = [{
  uuid: 0xFF01,
  value: new DataView(new ArrayBuffer(0)),
  lastChange: null,
  dom: createElement(),
  update: (c)=>{
    const lables = {
      0x00: '?',
      0x01: 'Stopped',
      0x02: 'Started',
      0x03: 'DOWN',
      0x04: 'UP',
    };
    const oknesses = {
      '?': 'unknown',
      'Stopped': 'bad',
      'Started': 'ok',
      'DOWN': 'bad',
      'UP': 'good',
    };
    const lable = c.value.byteLength ? lables[c.value.getUint8()] || 'Unknown!' : 'Not connected...';
    const okness = oknesses[lable];

    return html`
      <div class="tile ${okness}">
        <span class="title">ETH</span>
        <span class="value">${lable}</span>
      </div>
    `;
  }
},{
  uuid: 0xFF02,
  value: new DataView(new ArrayBuffer(0)),
  lastChange: null,
  dom: createElement(),
  update: (c)=>{
    if (!c.value.byteLength) return tile('LLDP', 'Pending...', 'ok');
    if (c.value.getUint8() === 0) return tile('LLDP', 'Listening...', 'ok');

    const lldp = parseLLDP(c.value);

    const tiles = {
      'Switch': lldp.find(v=>v.name==='System name')?.value
        || Object.values(lldp.find(v=>v.name==='Chassis ID')?.value || {})?.[0],
      'Port': lldp.find(v=>v.name==='Port description')?.value
        || Object.values(lldp.find(v=>v.name==='Port ID')?.value || {})?.[0],
      'Port VLAN': lldp.find(v=>
        v.name==='Vendor Specific'
        && v.value.subtypeName==='Port VLAN ID'
      )?.value?.value,
      'Voice': lldp.find(v=>
        v.name==='Vendor Specific'
        && v.value.subtypeName==='Network Policy'
        && v.value.value['Application Type']==='Voice'
      )?.value?.value?.['VLAN ID'],
    };

    lldp.filter(v=>
      v.name==='Vendor Specific'
      && v.value.subtypeName==='VLAN Name'
    ).forEach(v=>tiles['VLAN '+v.id] = v.name);

    const detail = lldp.map(tlv=>`${tlv.name}: ${JSON.stringify(tlv.value, null, 2)}`).join('\n');

    return html`
      ${tile('LLDP', 'OK', 'good', detail)}
      ${Object.entries(tiles).map(([title, value])=>value?tile(title, value, 'ok'):'')}
    `;
  }
},{
  uuid: 0xFF03,
  value: new DataView(new ArrayBuffer(0)),
  lastChange: null,
  dom: createElement(),
  update: (c)=>{
    console.log('VLAN', c.value);
    if (c.value.byteLength < 2) return tile('VLAN', 'None', 'ok');
    if (c.value.byteLength % 2) return tile('VLAN', 'Error', 'bad');
    const vlans = new Array(c.value.byteLength / 2).fill(0).map((v, i)=>
      tile('VLAN', c.value.getUint16(i*2) || 'Native', 'ok')
    );
    return html`${vlans}`;
  }
},];

const helpUi = createElement('HELP');


function tile(title, status, okness='unknown', fx=undefined) {
  let handler = ()=>{};
  let detail = '';
  if (typeof fx === 'function') {
    handler = fx;
  } else if (fx) {
    handler = (e)=>{
      const element = e.composedPath().find(e=>e.classList.contains('tile'));
      fx ? element.classList.toggle('detail') : element.classList.remove('detail');
    }
    detail = fx;
  }
  return html`
    <div class="tile ${okness}" @click=${handler}>
      <span class="title">${title}</span>
      <span class="value">${status}</span>
      ${typeof detail === 'string' ? html`
        <pre class="detail">${detail}</pre>
      ` : html`
        <div class="detail">${detail}</div>
      `}
    </div>
  `;
}

async function connect() {
  setBleStatus('connecting...', 'unknown');
  const device = await connectDevice(0x00ff).catch(e=>{
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

  characteristics.forEach(c=>watchCharacteristic(c.uuid, (value, isNotify)=>{
    if (isNotify) c.lastChange = new Date();
    c.value = value;
    render(c.update(c), c.dom);
  }));
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
