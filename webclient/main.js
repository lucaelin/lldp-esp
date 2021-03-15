//import './mock/ble.js';

import {html, render} from 'https://unpkg.com/lit-html?module';
import {until} from 'https://unpkg.com/lit-html/directives/until.js?module';
import {live} from 'https://unpkg.com/lit-html/directives/live.js?module';
import {connectDevice, disconnect, watchCharacteristic, createSnapshot, setSnapshot} from './ble.js';
import tile from './tile.js';

import ethUi from './ui/eth.js';
import lldpUi from './ui/lldp.js';

const bleStatus = {
  unavailable: ['unavailable', 'bad', html`
    <pre>Web Bluetooth is unavailable on your system or browser.
    Apple decided against implementing this API - Mozilla followed.
    Google Chrome, Edge (Chromium) and Opera should work fine, if the device has BLE capabilities.</pre>
  `],
  failed: ['FAILED!', 'bad'],
  not_connected: ['connect', 'ok', connect],
  connecting: ['connecting...', 'ok'],
  connected: ['connected', 'good', ()=>window.location.reload()],
  disconnected: ['disconnected', 'bad'],
  history: ['connect', 'unknown', connect],
}
const historyValues = localStorage;

// Object.keys(historyValues).map(k=>[k, historyValues.removeItem(k)]);

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

async function saveSnapshot(e) {
  let description = '';
  if (e) {
    e.preventDefault();
    description = e.target.querySelector('[name="description"]').value
  }
  const snap = await createSnapshot();
  const time = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
  localStorage.setItem(time, JSON.stringify({time, description, snap}));
  setBleStatus(bleStatus.connected);
}
async function saveSnapshotDescription(snapshotName, description) {
  const snapshot = JSON.parse(historyValues.getItem(snapshotName));
  localStorage.setItem(snapshotName, JSON.stringify({...snapshot, description}));
}
async function loadSnapshotDescription(snapshotName) {
  const snapshot = JSON.parse(historyValues.getItem(snapshotName));
  return snapshot.description;
}
async function removeSnapshot(v, status, snapshotName) {
  localStorage.removeItem(v);
}
async function loadSnapshot(v) {
  console.log('loading snapshot', v);

  const snapshot = historyValues.getItem(v);
  if (snapshot) setSnapshot(JSON.parse(snapshot).snap);
  setBleStatus(bleStatus.history, v);
}

function setBleStatus(status, snapshotName) {
  const connected = status === bleStatus.connected;
  const history = status === bleStatus.history;

  if (history && !snapshotName) setSnapshot();
  if (status === bleStatus.failed) {
    window.setTimeout(()=>setBleStatus(bleStatus.not_connected), 1500);
    setSnapshot();
  }

  const historySelect = Object.entries(historyValues).sort((a,b)=>b[0].localeCompare(a[0])).map((v)=>[
    v[0], html`
      <button class="dark warn" @click=${()=>removeSnapshot(v[0])}>❌ delete</button>
      <div> <!-- this div somehow prevents autofocus on the textarea if the parent is display: flex -->
        <textarea class="dark wide"
          placeholder="Add description"
          rows="6"
          @keyup=${(e)=>saveSnapshotDescription(v[0], e.target.value, e)}
          .value=${until(loadSnapshotDescription(v[0]), 'loading...')}
        ></textarea>
      </div>
    `, ()=>loadSnapshot(v[0])
  ]);
  const historyDashboard = [
    historyValues.length + ' Entries',
    connected ? html`
      <form class="flex flex-gap" @submit=${(e)=>saveSnapshot(e)}>
        <button class="dark good">➕ create new</button>
        <textarea class="dark wide"
          name="description"
          placeholder="Add description"
          rows="6"
        ></textarea>
      </form>
    ` : html`
      <p>Connect to a device to take snapshots of its configuration!</p>
    `,
    ()=>setBleStatus(bleStatus.history),
  ]

  render(html`
    ${tile('BLE', ...status)}
    ${tile(
      'History',
      [historyDashboard, ...historySelect],
      snapshotName ? 'good' : (connected ? 'unknown' : 'ok'),
    )}
  `, bleUi);
}

async function connect() {
  setBleStatus(bleStatus.connecting);
  const device = await connectDevice(bleService).catch(e=>{
    setBleStatus(bleStatus.failed);
  });
  if (!device) return;
  setBleStatus(bleStatus.connected);
  device.addEventListener('gattserverdisconnected', ()=>setBleStatus(bleStatus.disconnected));
  device.addEventListener('gattserverconnected', ()=>setBleStatus(bleStatus.connected));
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
          render(value.byteLength ? c.update(c) : html``, c.dom);
        });
      })
    } else {
      c.value = new DataView(new ArrayBuffer(0));
      watchCharacteristic(c.uuid, (value, isNotify)=>{
        if (isNotify) c.lastChange = new Date();
        c.value = value;
        render(value.byteLength ? c.update(c) : html``, c.dom);
      })
    }
  });
  const isBluetoothAvailable = navigator.bluetooth ? await navigator.bluetooth.getAvailability() : false;

  if (isBluetoothAvailable) {
    setBleStatus(bleStatus.not_connected);
  } else {
    setBleStatus(bleStatus.unavailable);
  }
}

function createElement(name) {
  const dom = document.createElement('div');
  document.querySelector('main').appendChild(dom);
  return dom;
}

init();
