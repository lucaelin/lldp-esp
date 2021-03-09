import {html} from 'https://unpkg.com/lit-html?module';
import tile from '../tile.js';
import {parseLLDP} from '../lldp.js';

function extendObj(base, key, ext) {
  if (!base[key]) base[key] = {};
  base[key] = {...base[key], ...ext};
}

function getVLANState(vlan) {
  if (vlan.announced && vlan.detected) return 'good';
  if (vlan.announced) return 'ok';
  return 'unknown';
}

export default {
  uuid: {
    lldp: 0xFF02,
    vlan: 0xFF03,
  },
  update: (c)=>{
    if (!c.value.lldp || !c.value.lldp.byteLength) return tile('LLDP', 'Pending...', 'ok');
    if (c.value.lldp.getUint8() === 0) return tile('LLDP', 'Listening...', 'ok');

    const lldp = parseLLDP(c.value.lldp);
    const vlanStatus = c.value.vlan && c.value.vlan.byteLength ? !(c.value.vlan.byteLength % 2) ? 'good' : 'bad' : 'unknown';
    const detectedVlans = c.value.vlan && !(c.value.vlan.byteLength % 2) && c.value.vlan.byteLength >= 2 ?
      new Array(c.value.vlan.byteLength / 2).fill(0).map((v, i)=>c.value.vlan.getUint16(i*2))
    : [];

    const tiles = {
      'Switch': lldp.find(v=>v.name==='System name')?.value
        || Object.values(lldp.find(v=>v.name==='Chassis ID')?.value || {})?.[0],
      'Port': lldp.find(v=>v.name==='Port description')?.value
        || Object.values(lldp.find(v=>v.name==='Port ID')?.value || {})?.[0],
    };

    const vlans = {};

    const portVLAN = lldp.find(v=>
      v.name==='Vendor Specific'
      && v.value.subtypeName === 'Port VLAN ID'
    )?.value?.value;
    if (portVLAN) extendObj(vlans, portVLAN, {announced: true, role: 'Port'})

    const voiceVLAN = lldp.find(v=>
      v.name==='Vendor Specific'
      && v.value.subtypeName === 'Network Policy'
      && v.value.value['Application Type']==='Voice'
    )?.value?.value?.['VLAN ID'];
    if (voiceVLAN) extendObj(vlans, voiceVLAN, {announced: true, role: 'Voice'})

    lldp.filter(v=>
      v.name==='Vendor Specific'
      && v.value.subtypeName === 'VLAN Name'
    ).forEach(v=>extendObj(vlans, v.value.value.id, {name: v.value.value.name, announced: true}));

    detectedVlans.filter(v=>v!==0).forEach(v=>extendObj(vlans, v, {detected: true, tagged: true}));
    if (detectedVlans[0]===0) extendObj(vlans, portVLAN || 0, {detected: true, untagged: true});

    const detail = lldp.map(tlv=>`${tlv.name}: ${JSON.stringify(tlv.value, null, 2)}`).join('\n');

    console.log('vlans', vlans);

    return html`
      ${tile('LLDP', 'GOOD', 'good', detail)}
      ${tile('VLAN', vlanStatus.toUpperCase(), vlanStatus, detectedVlans.join(', '))}
      ${Object.entries(tiles).map(([title, value])=>value?tile(title, value, 'ok'):'')}
      ${Object.entries(vlans).map(([id, vlan])=>tile(
        (vlan.untagged ? 'Native ' : '') + (vlan.role || '') + ' VLAN',
        vlan.name ? id+'\n'+vlan.name : id,
        getVLANState(vlan),
        {id: id, ...vlan},
      ))}
    `;
  }
}
