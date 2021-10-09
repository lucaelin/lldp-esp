import {html} from 'https://unpkg.com/lit-html@1.4.1?module';
import tile from './tile.js';
import {parseSTP} from '../stp.js';

export default {
  uuid: 0xFF04,
  update: (c)=>{
    if (!c.value.byteLength) return tile('STP', 'pading', 'unknown');
    if (c.value.byteLength < 2) return tile('STP', 'ok', 'ok');

    const stp = parseSTP(c.value);

    const path = [];
    let remainingCost = stp['Root Path Cost'];
    while (remainingCost >= 200000) {path.push('100M'); remainingCost-=200000};
    while (remainingCost >= 20000) {path.push('1G'); remainingCost-=20000};
    while (remainingCost >= 10000) {path.push('2G'); remainingCost-=10000};
    while (remainingCost >= 2000) {path.push('10G'); remainingCost-=2000};
    while (remainingCost >= 200) {path.push('100G'); remainingCost-=200};

    return html`
      ${tile('STP', 'GOOD', 'good', stp)}
      ${tile('Port', stp['Port Identifier']['ID'], 'ok', stp['Port Identifier'])}
      ${tile('Bridge', stp['Bridge Identifier']['System ID'], 'ok', stp['Bridge Identifier'])}
      ${tile('Root', stp['Root Identifier']['System ID'], 'ok', stp['Root Identifier'])}
      ${tile('Path', path.length ? '-'+path.join('-')+'-' : 'direct', 'ok', {
        'Estimated Path': path,
        'Estimated Path Length': path.length,
        'Path Cost': stp['Root Path Cost'],
      })}
    `;
  }
}
