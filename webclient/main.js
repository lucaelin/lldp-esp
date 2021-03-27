import './mock/ble.js';

import {html, render} from 'https://unpkg.com/lit-html?module';
import {until} from 'https://unpkg.com/lit-html/directives/until.js?module';
import {live} from 'https://unpkg.com/lit-html/directives/live.js?module';
import {connectDevice, disconnect, watchCharacteristic, canReconnect} from './ble.js';
import {
  saveSnapshot,
  saveSnapshotDescription,
  removeSnapshot,
  loadSnapshot,
  listSnapshots,
  shareSnapshot,
  importSnapshot
} from './snapshot.js'
import tile, {createTileContainer} from './ui/tile.js';

import helpUi from './ui/help.js';
import ethUi from './ui/eth.js';
import lldpUi from './ui/lldp.js';

const bleService = 0x00FF;

const bleStatus = {
  unavailable: ['unavailable', 'bad', html`<p>
    Web Bluetooth is unavailable on your system or browser.
    Apple decided against implementing this API - Mozilla followed.
    Google Chrome, Edge (Chromium) and Opera should work fine, if the device has BLE capabilities.
  </p>`],
  failed: ['FAILED!', 'bad'],
  not_connected: ['connect', 'ok', connect],
  connecting: ['connecting...', 'ok'],
  connected: ['connected', 'good', ()=>window.location.reload()],
  disconnected: ['disconnected', 'bad'],
  history: ['connect', 'unknown', connect],
}

// Object.keys(historyValues).map(k=>[k, historyValues.removeItem(k)]);

const bleContainer = createTileContainer('BLE');
const characteristics = [ethUi, lldpUi].map(c=>({
  ...c,
  value: typeof c.uuid === 'object' ?
    Object.fromEntries(Object.entries(c.uuid).map(([k,v])=>
      [k,new DataView(new ArrayBuffer(0))]
    )) : new DataView(new ArrayBuffer(0)),
  lastChange: null,
  dom: createTileContainer(),
}));
const helpContainer = createTileContainer('HELP');

function setBleStatus(status, snapshotName) {
  const connected = status === bleStatus.connected;
  const history = status === bleStatus.history;

  if (history && !snapshotName) loadSnapshot();
  if (status === bleStatus.failed) {
    window.setTimeout(()=>setBleStatus(bleStatus.not_connected), 1500);
    loadSnapshot();
  }

  const historySelect = listSnapshots(bleService).map((v)=>[
    v[1].time + (v[1].imported?' *':''), html`
      <button class="dark warn" @click=${()=>removeSnapshot(v[0])}>❌ delete</button>
      <button class="dark ok" @click=${(e)=>{
        shareSnapshot(v[0]).catch(e=>e.message).then(msg=>{
            const prev = e.target.textContent;
            e.target.textContent = msg;
            window.setTimeout(()=>{e.target.textContent = prev}, 1000);
        });
      }}>📨 share</button>
      <div> <!-- this div somehow prevents autofocus on the textarea if the parent is display: flex -->
        <textarea class="dark wide"
          placeholder="Add description"
          rows="6"
          @keyup=${(e)=>saveSnapshotDescription(v[0], e.target.value, e)}
          .value=${v[1].description || ''}
        ></textarea>
      </div>
      ${v[1].imported && html`<p>* imported ${v[1].imported}`}
    `, ()=>{
      loadSnapshot(v[0]);
      setBleStatus(bleStatus.history, v);
    }
  ]);
  const historyDashboard = [
    historySelect.length + ' entries',
    connected ? html`
      <form class="flex flex-gap" @submit=${(e)=>{
        e.preventDefault();
        const description = e.target.querySelector('[name="description"]').value
        saveSnapshot(bleService, description);
        setBleStatus(bleStatus.connected);
      }}>
        <button class="dark good">💾 create new</button>
        <textarea class="dark wide"
          name="description"
          placeholder="Add description"
          rows="6"
        ></textarea>
      </form>
    ` : html`
      <p>Connect to a device to take snapshots of its configuration!</p>
    `,
    ()=>canReconnect()?connect():setBleStatus(bleStatus.history)
  ];

  render(html`
    ${tile('BLE', ...status)}
    ${tile(
      'History',
      [historyDashboard, ...historySelect],
      snapshotName ? 'good' : (connected ? 'unknown' : 'ok'),
    )}
  `, bleContainer);
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

async function init() {
  render(helpUi, helpContainer);

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
  if (window.location.hash.length > 1) {
    const name = await importSnapshot(window.location.hash.slice(1,Infinity));
    window.location.hash = '';
    loadSnapshot(name);
    const index = listSnapshots(bleService).findIndex((v)=>v.id === name);
    setBleStatus(bleStatus.history, name);
    bleContainer.classList.add('expand');
    const historySwipe = bleContainer.querySelector('.swipe');
    historySwipe.scrollTo(index + 1 * historySwipe.clientWidth, 0);
  }
}

init();
