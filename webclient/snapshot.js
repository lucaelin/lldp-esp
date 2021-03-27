import {createSnapshot, setSnapshot} from './ble.js';
import { b64encodeString, b64decodeString } from './b64.js';

const historyValues = localStorage;

export async function saveSnapshot(bleService, description) {
  const snap = await createSnapshot();
  const time = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
  const id = `ble_${bleService}_${Date.now()}`;
  historyValues.setItem(id, JSON.stringify({
    id, time, description, service: bleService, snap
  }));
}
export async function saveSnapshotDescription(snapshotName, description) {
  const snapshot = JSON.parse(historyValues.getItem(snapshotName));
  historyValues.setItem(snapshotName, JSON.stringify({...snapshot, description}));
}
export async function removeSnapshot(v, status, snapshotName) {
  historyValues.removeItem(v);
}
export async function importSnapshot(v) {
  console.log('importing snapshot from url hash');
  const data = JSON.parse(b64decodeString(v));
  data.id = `ble_${data.service}_${Date.now()}`;
  data.imported = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
  historyValues.setItem(data.id, JSON.stringify(data));
  console.log('import saved as', data.id);
  return data.id;
}
export async function loadSnapshot(v) {
  if (!v) return setSnapshot();
  console.log('loading snapshot', v);
  const snapshot = historyValues.getItem(v);
  if (snapshot) setSnapshot(JSON.parse(snapshot).snap);
}
export function listSnapshots(bleService) {
  return Object.keys(historyValues)
    .filter(k=>k.startsWith(`ble_${bleService}_`))
    .map(k=>[k, JSON.parse(historyValues.getItem(k))])
    .sort((a,b)=>b[0].localeCompare(a[0]));
}
export function shareSnapshot(v) {
  console.log('sharing snapshot', v);

  const snapshot = historyValues.getItem(v);
  const url = window.location.toString().split('#')[0]+'#'+b64encodeString(snapshot);
  if ('share' in navigator) {
    return navigator.share({
      url,
      title: 'LLDP-ESP Measurement',
      text: 'I took a LLDP Port measurement I wanted to share with you!\n'+snapshot.description,
    }).then(()=>'📣 shared!')
  }
  if ('clipboard' in navigator) {
    return navigator.clipboard.writeText(url).then(()=>'🗒 copied!')
  }
  return Promise.reject(new Error('❌ no way!'));
}
