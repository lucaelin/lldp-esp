import {html} from 'https://unpkg.com/lit-html?module';
import tile from '../tile.js';
import {parseLLDP} from '../lldp.js';
import {parseVLAN} from '../vlan.js';

function extendObj(base, key, ext) {
  if (!base[key]) base[key] = {};
  base[key] = {...base[key], ...ext};
}

function getVLANState(vlan) {
  if (vlan.announced && vlan.detected && vlan.traffic?.arp) return 'good';
  if (vlan.announced) return 'ok';
  return 'unknown';
}

export default {
  uuid: {
    lldp: 0xFF02,
    vlan: 0xFF03,
  },
  update: (c)=>{
    const lldp = parseLLDP(c.value.lldp);
    const lldpStatus = c.value.lldp && c.value.lldp.byteLength ? lldp.length ? 'good' : c.value.lldp.byteLength > 2 ? 'bad' : 'ok' : 'unknown';
    const vlanStatus = c.value.vlan && c.value.vlan.byteLength ? !(c.value.vlan.byteLength % 3) ? 'good' : 'bad' : 'unknown';
    const detectedVlans = vlanStatus === 'good' ?
      parseVLAN(c.value.vlan)
    : [];
    console.log('detectedVlans', detectedVlans);

    const tiles = {
      'Switch': lldp.find(v=>v.name==='System name')?.value
        || Object.values(lldp.find(v=>v.name==='Chassis ID')?.value || {})?.[0],
      'Port': lldp.find(v=>v.name==='Port description')?.value
        || Object.values(lldp.find(v=>v.name==='Port ID')?.value || {})?.[0],
      'POE': lldp.find(v=>(v.name==='Vendor Specific'
        && v.value.subtypeName === 'Extended Power-via-MDI')
      )?.value?.value?.['Power value'],
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

    detectedVlans.filter(v=>v.id!==0).forEach(v=>extendObj(vlans, v.id, {detected: true, tagged: true, traffic: v.traffic}));
    if (detectedVlans[0]?.id===0 && detectedVlans[0]?.traffic?.arp) extendObj(vlans, portVLAN || 0, {detected: true, untagged: true, traffic: detectedVlans[0].traffic});

    const detail = lldp.map(tlv=>`${tlv.name}: ${JSON.stringify(tlv.value, null, 2)}`).join('\n');

    console.log('vlans', vlans);

    return html`
      ${tile('LLDP', lldpStatus.toUpperCase(), lldpStatus, detail)}
      ${tile('VLAN', vlanStatus.toUpperCase(), vlanStatus, detectedVlans)}
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
