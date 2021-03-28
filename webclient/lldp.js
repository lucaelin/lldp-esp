import {
  dvSlice,
  getMac,
  getHex,
  getString,
  getIPv4,
  getIPv6,
} from './packet.js';

const parseTlvValue = {
  0x01: ['Chassis ID', (packet) => {
    const subtype = packet.getUint8(0);
    const data = dvSlice(packet, 1);
    switch (subtype) {
      case 0x01: return {type: 'Chassis component', value: getHex(data)};
      case 0x02: return {type: 'Interface alias',   value: getHex(data)};
      case 0x03: return {type: 'Port component',    value: getHex(data)};
      case 0x04: return {type: 'MAC address',       value: getMac(data)};
      case 0x05: return {type: 'Network address',   value: getHex(data)};
      case 0x06: return {type: 'Interface name',    value: getString(data)};
      case 0x07: return {type: 'Locally assigned',  value: getString(data)};
    }
    return {type: 'Unknown', value: getHex(packet)};
  }],
  0x02: ['Port ID', (packet) => {
    const subtype = packet.getUint8(0);
    const data = dvSlice(packet, 1);
    switch (subtype) {
      case 0x01: return {type: 'Interface alias',   value: getHex(data)};
      case 0x02: return {type: 'Port component',    value: getHex(data)};
      case 0x03: return {type: 'MAC address',       value: getMac(data)};
      case 0x04: return {type: 'Network address',   value: getHex(data)};
      case 0x05: return {type: 'Interface name',    value: getString(data)};
      case 0x06: return {type: 'Agent circuit ID',  value: getHex(data)};
      case 0x07: return {type: 'Locally assigned',  value: getString(data)};
    }
    return {type: 'Unknown', value: getHex(packet)};
  }],
  0x03: ['Time To Live', (packet) => packet.getUint16()],
  0x04: ['Port description', (packet) => getString(packet)],
  0x05: ['System name', (packet) => getString(packet)],
  0x06: ['System description', (packet) => getString(packet)],
  0x07: ['System capabilities', (packet) => getHex(packet)],
  0x08: ['Management address', (packet) => {
    const length = packet.getUint8(0);
    const type = packet.getUint8(1);
    const address = dvSlice(packet, 2, 1+length);

    const ret = {
      'Address': {
        type,
        value: getHex(address),
      },
    };
    if (type===1) ret['Address'] = {IPv4: getIPv4(address)};
    if (type===2) ret['Address'] = {IPv6: getIPv6(address)};

    const ifoffset = 1+length;
    if (packet.byteLength >= ifoffset) {
      // TODO: check subtype usage
      ret['Interface Subtype'] = packet.getUint8(ifoffset);
      ret['Interface Number'] = packet.getUint32(ifoffset+1);
    }

    const oidoffset = ifoffset + 5;
    if (packet.byteLength >= oidoffset) {
      const oidlength = packet.getUint8(oidoffset);
      ret['OID'] = getString(dvSlice(packet, oidoffset+1, oidoffset+1+oidlength));
    }

    return ret;
  }],

  0x7f: ['Vendor Specific', (packet) => {
    const vendor = getHex(dvSlice(packet, 0, 3));
    const [vendorName='Unknown Vendor', subtypes={}] = vendorTlvValues[vendor] || [];
    const subtype = packet.getUint8(3);
    const data = dvSlice(packet, 4);
    const [subtypeName="Unknown Vendor Subtype", parse] = subtypes[subtype] || [];
    const value = parse?parse(data):getHex(data);
    return {
      vendor,
      vendorName,
      subtypeName,
      value
    }
  }],
}

const vendorTlvValues = {
  '00-80-c2': ['IEEE 802.1', {
    0x1: ['Port VLAN ID', data=>data.byteLength===2?data.getUint16():getHex(data)],
    0x2: ['Port And Protocol VLAN ID', data=>getHex(data)],
    0x3: ['VLAN Name', data=>{
      const id = data.getUint16(0);
      const length = data.getUint8(2);
      const name = getString(dvSlice(data, 3, 3+length));
      return {
        id,
        name,
      }
    }],
    0x4: ['Protocol Identity', data=>getHex(data)],
    0x5: ['VID Usage Digest', data=>getHex(data)],
    0x6: ['Management VID', data=>getHex(data)],
    0x7: ['Link Aggregation', data=>getHex(data)],
    0x8: ['Congestion Notification', data=>getHex(data)],
    0x9: ['ETS Configuration', data=>getHex(data)],
    0xa: ['ETS Recommendation', data=>getHex(data)],
    0xb: ['Priority-based Flow Control Configuration', data=>getHex(data)],
    0xc: ['Application Priority', data=>getHex(data)],
    0xd: ['EVB', data=>getHex(data)],
    0xe: ['CDCP', data=>getHex(data)],
    0xf: ['Port extension', data=>getHex(data)],
  }],
  '00-12-0f': ['IEEE 802.3', {
    0x1: ['MAC/PHY Configuration/Status', data=>{
      const neg = data.getUint8();
      return {
        'Auto-Negotiation Supported': neg >>> 0 & 0x1,
        'Auto-Negotiation Enabled': neg >>> 1 & 0x1,
        'Auto-Negotiation Capabilities': '0x'+data.getUint16(1).toString(16),
        'Operational MAU Type': '0x'+data.getUint16(3).toString(16),
      }
    }],
    // TODO: https://ieee802.org/3/bt/public/mar15/Schindler_3bt_01_03_15.pdf
    // TODO: https://en.wikipedia.org/wiki/Power_over_Ethernet
    0x2: ['Power Via MDI', data=>getHex(data)],
    0x3: ['Link Aggregation', data=>getHex(data)],
    0x4: ['Maximum Frame Size', data=>getHex(data)],
  }],
  '00-12-bb': ['TIA TR-41', {
    0x1: ['LLDP-MED Capabilities', (data)=>{
      const capabilities = data.getUint16(0).toString(2).padStart(16,'0')
        .split('').map(v=>v==='1').reverse();
      const ret = {
        'Capabilities': {
          'LLDP-MED Capabilities': capabilities[0],
          'Network Policy': capabilities[1],
          'Location Identification': capabilities[2],
          'Extended Power via MDI-PSE': capabilities[3],
          'Extended Power via MDI-PD': capabilities[4],
          'Inventory': capabilities[5],
        },
        'Class Type': data.getUint8(2),
      }
      return ret;
    }],
    // TODO: used for voice vlan id and qos indication
    0x2: ['Network Policy', data=>{
      data = data.getUint32();
      const apptype = data >>> 24 & 0xFF;
      return {
        'Application Type': apptype === 1 ? 'Voice' : apptype,
        'Policy': data >>> 23 & 0x01,
        'Tagged': data >>> 22 & 0x01,
        'VLAN ID': data >>> 9 & 0xFFF,
        'L2 Priority': data >>> 6 & 0x07,
        'DSCP Priority': data >>> 0 & 0x37,
      }
    }],
    0x3: ['Location Identification', data=>getHex(data)],
    // https://en.wikipedia.org/wiki/Power_over_Ethernet
    0x4: ['Extended Power-via-MDI', data=>{
      const support = data.getUint8(0);
      const ret = {
        'Power type': support >>> 6 & 0x03,
        'Power source': support >>> 4 & 0x03,
        'Power priority': support & 0x0f,
        'Power value': data.getUint16(1) / 10 + ' W',
      };
      if (data.byteLength > 3) {
        ret['Unknown'] = getHex(dbSlice(data, 3));
      }
      return ret;
    }],
    0x5: ['Inventory - Hardware Revision', data=>getHex(data)],
    0x6: ['Inventory - Firmware Revision', data=>getHex(data)],
    0x7: ['Inventory - Software Revision', data=>getHex(data)],
    0x8: ['Inventory - Serial Number', data=>getHex(data)],
    0x9: ['Inventory - Manufacturer Name', data=>getHex(data)],
    0xa: ['Inventory - Model Name', data=>getHex(data)],
    0xb: ['Inventory - Asset ID', data=>getHex(data)],
  }],
}


function parseTLV(packet, offset) {
  const head = packet.getUint16(offset);
  const type = head >>> 9;
  const length = head & 0x1FF;
  const data = dvSlice(packet, offset+2, offset+2+length)
  const [name='unknown', parser] = parseTlvValue[type] || [];
  const value = parser?parser(data):getHex(data);

  return {
    offset,
    type,
    name,
    length,
    data,
    value,
  }
}

export function parseLLDP(packet) {
  //console.log(getHex(packet))
  const tlvs = [];
  let offset = 0;

  while(offset + 1 < packet.byteLength) {
    const tlv = parseTLV(packet, offset);
    if (tlv.type === 0) break;
    tlvs.push(tlv);
    offset += 2+tlv.length;
  }
  //console.log(tlvs);
  return tlvs;
}
