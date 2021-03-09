let service = null;
const handles = {};

async function timeout(promise, delay = 3000, error = new Error('Timeout')) {
  return Promise.race([
    promise,
    new Promise((res, rej)=>setTimeout(()=>rej(error), delay))
  ]);
}

export async function connectDevice(serviceUuid) {
  console.log('Requesting Bluetooth Device...');

  const device = await navigator.bluetooth.requestDevice({
    filters: [{services: [serviceUuid]}]
  });
  console.log('Got device', device);
  console.log('Got device', device.gatt);

  device.addEventListener('gattserverdisconnected', ()=>connectGatt(device, serviceUuid, 2000));

  await connectGatt(device, serviceUuid);

  return device;
}

async function connectGatt(device, serviceUuid, delay=0) {
  service = null;
  await new Promise(res=>setTimeout(res, delay));
  delay = 2000;

  console.log('Connecting to GATT Server...');
  const server = await timeout(device.gatt.connect(), 3000).catch((e)=>{
    console.error(e);
    return null;
  });
  if (!server) return connectGatt(device, serviceUuid, delay);
  device.dispatchEvent(new Event('gattserverconnected')); // i wish this event existed in the spec...
  console.log('Got server', server);

  console.log('Getting Service...');
  service = await timeout(server.getPrimaryService(serviceUuid), 3000).catch((e)=>{
    console.error(e);
    return null;
  });
  if (!service) {
    console.warn('Failed getting service, disconnecting...');
    alert('An error occurred: Timeout getting primary Service');
    return window.location.reload();
  }
  console.log('Got service', service);

  console.log('Setting up characteristics');
  for (const c of Object.keys(handles)) {
    await setupWatchCharacteristic(c);
  }
  console.log('Setting up characteristics complete');
}

export async function watchCharacteristic(uuid, cb) {
  uuid = typeof uuid === 'number' ? '0x'+uuid.toString(16) : uuid;
  const isFirstWatch = !handles[uuid];
  if (!handles[uuid]) handles[uuid] = [];
  handles[uuid].push(cb);
  if (service && isFirstWatch) setupWatchCharacteristic(uuid);
}

async function setupWatchCharacteristic(uuid) {
  const createdService = service;
  if (uuid.startsWith('0x')) uuid = parseInt(uuid);
  console.log('Getting Characteristic ', uuid);
  const char = await service.getCharacteristic(uuid);
  console.log('Got Characteristic ', char);

  let fallbackInterval;

  const handleValueChanged = async (e) => {
    if (service !== createdService && fallbackInterval) return window.clearInterval(fallbackInterval);
    const isNotify = e && e.type==='characteristicvaluechanged' ? true : false;
    const isNotifyFullValue = isNotify && e.target.value.byteLength !== 20 ? true : false; // see WebBluetoothCG/web-bluetooth/issues/274
    console.log('Handling value change', uuid, 'isNotify:', isNotify);
    //return console.log(char);
    console.log('Reading value on change', uuid, 'isNotifyFullValue:', isNotifyFullValue);
    const value = isNotifyFullValue ? e.target.value : await char.readValue();
    console.log('Got new value', uuid);
    uuid = typeof uuid === 'number' ? '0x'+uuid.toString(16) : uuid;
    await Promise.all(handles[uuid].map(cb=>{
      try {
        return cb(value, isNotify);
      } catch(e) {
        console.error('Error trying to update watch:', e);
      }
    }))
    console.log('Completed callbacks', uuid);
  };

  if (char.properties.notify) {
    char.addEventListener('characteristicvaluechanged', handleValueChanged);
    await char.startNotifications();
  } else {
    console.warn('using fallback 3s polling for', uuid);
    fallbackInterval = window.setInterval(handleValueChanged, 3000);
  }
  console.log(uuid, 'setup complete, getting initial value');
  await handleValueChanged();
  console.log(uuid, 'got initial value');
}
