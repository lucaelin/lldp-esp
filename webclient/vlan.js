const ethertypeEnc = [
  'any',
  'arp',
  'ipv4',
  'ipv6',
  'unknown',
  'unknown',
  'unknown',
  'other'
];

export function parseVLAN(data) {
  const vlans = [];
  let offset = 0;

  while(offset + 2 < data.byteLength) {
    const ethertypes = data.getUint8(offset+2);
    vlans.push({
      id: data.getUint16(offset) & 0xFFF,
      ethertypes: ethertypes,
      traffic: Object.fromEntries(ethertypeEnc.map((v,i)=>[v, (ethertypes&(1<<i)) !== 0])),
    });

    offset += 3;
  }
  return vlans;
}
