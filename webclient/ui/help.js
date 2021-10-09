import {html} from 'https://unpkg.com/lit-html@1.4.1?module';
import tile from './tile.js';

const helptext = html`
<div>
  <h2>Where am I?</h2>
  <p>The esp-lldp tool is a webapp that works in combination with an ESP32 with onboard ethernet and is useful for debugging or configuring network equipment.<br />
  Its purpose is to passively listen on ethernet traffic and extract information about the switch it is connected to.<br />
  If the connected equipment is sending LLDP messages, those are parsed and shown here, too.</p>
  <h2>How do I connect?</h2>
  <p>Once your ESP is up and running, you can use the "connect" button above. You'll see a list of Bluetooth-devices. Choose your device and click pair.</p>
  <h2>What can I see after connecting?</h2>
  <p>You will be shown information about: <ul>
    <li>Bluetooth connectivity status</li>
    <li>Ethernet connectivity status</li>
    <li>LLDP status and information</li>
    <li>Detected VLANs</li>
  </ul></p>
  <p>Now that you are connected, you can also create entries in the apps history. Tap the "History"-Tile, then "create" to take a snapshot of the current data. You can now browse your history even without a device at hand.</p>
</div>
`;

export default tile('HELP', '?', 'unknown', helptext);
