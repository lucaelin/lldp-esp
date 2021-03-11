import {html} from 'https://unpkg.com/lit-html?module';

export default function tile(title, status, okness='unknown', fx=undefined) {
  let handler = ()=>{};
  let detail = '';
  if (typeof fx === 'function') {
    handler = fx;
  } else if (fx) {
    handler = (e)=>{
      if (e.composedPath().find(e=>e.classList?.contains('preventParentClick'))) return;
      const element = e.composedPath().find(e=>e.classList?.contains('tile'));
      fx ? element.classList.toggle('detail') : element.classList.remove('detail');
    }
    if (typeof fx === 'string') {
      detail = html`<pre>${fx}</pre>`;
    } else if (typeof fx === 'object') {
      if (fx.type === 'html')
        detail = fx;
      else
        detail = html`<pre>${Object.entries(fx)
          .map(([name,value])=>`${name}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`).join('\n')
        }</pre>`;
    }
  }
  return status?html`
    <div class="tile ${okness}" @click=${handler}>
      <span class="title">${title}</span>
      <span class="value">${status}</span>
      ${typeof detail === 'string' ? html`
        <pre class="detail preventParentClick">${detail}</pre>
      ` : html`
        <div class="detail preventParentClick">${detail}</div>
      `}
    </div>
  `:html``;
}
