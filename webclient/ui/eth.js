import {html} from 'https://unpkg.com/lit-html?module';
import tile from '../tile.js';

const lables = {
  0x00: '?',
  0x01: 'Stopped',
  0x02: 'Started',
  0x03: 'DOWN',
  0x04: 'UP',
};
const oknesses = {
  '?': 'unknown',
  'Stopped': 'bad',
  'Started': 'ok',
  'DOWN': 'bad',
  'UP': 'good',
};

export default {
  uuid: 0xFF01,
  update: (c)=>{
    const lable = c.value.byteLength ? lables[c.value.getUint8()] || 'Unknown!' : 'Not connected...';
    const okness = oknesses[lable];

    return html`
      <div class="tile ${okness}">
        <span class="title">ETH</span>
        <span class="value">${lable}</span>
      </div>
    `;
  }
}