import {
  dvSlice,
  getMac,
  getHex,
  getString,
  getIPv4,
  getIPv6,
} from './packet.js';

export function parseSTP(packet) {
  const ret = {};

      console.log(getHex(packet))
  ret['Protocol Identifier'] = packet.getUint16(0);
  ret['Protocol Version Identifier'] = packet.getUint8(2);
  ret['BPDU Type'] = packet.getUint8(3);
  const flags = packet.getUint8(4).toString(2).padStart(8, '0').split('').map(v=>v==='1');
  ret['BPDU Flags'] = {
    'Topology Change': flags[0],
    'Proposal': flags[1],
    'Port Role': (flags[2]&&1) + 2*(flags[3]&&1),
    'Learning': flags[4],
    'Forwarding': flags[5],
    'Agreement': flags[6],
    'Topology Change Acknowledgement': flags[7],
  };
  ret['Root Identifier'] = {
    'Priority': packet.getUint16(5) & 0xF000,
    'System ID Extension': packet.getUint16(5) & 0x0FFF,
    'System ID': getMac(dvSlice(packet, 7, 14)),
  };
  ret['Root Path Cost'] = packet.getUint16(15);
  ret['Bridge Identifier'] = {
    'Priority': packet.getUint16(17) & 0xF000,
    'System ID Extension': packet.getUint16(17) & 0x0FFF,
    'System ID': getMac(dvSlice(packet, 19, 25)),
  };
  ret['Port Identifier'] = {
    'Priority': packet.getUint16(25) & 0xF000,
    'ID': packet.getUint16(25) & 0x0FFF,
  };
  ret['Message Age'] = packet.getUint8(27);
  ret['Max Age'] = packet.getUint8(29);
  ret['Hello Time'] = packet.getUint8(31);
  ret['Forward Delay'] = packet.getUint8(33);
  ret['Version 1 Length'] = packet.getUint8(35);

  return ret;
}
