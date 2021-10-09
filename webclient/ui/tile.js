import {html} from 'https://unpkg.com/lit-html@1.4.1?module';
import {classMap} from 'https://unpkg.com/lit-html@1.4.1/directives/class-map.js?module';

export function createTileContainer(name) {
  const dom = document.createElement('div');
  document.querySelector('main').appendChild(dom);
  return dom;
}

function renderDetail(detail) {
  if (detail === undefined) return html``;
  if (typeof detail === 'function') return html``;

  if (typeof detail === 'string')
    detail = html`<pre>${detail}</pre>`;

  if (detail.type !== 'html')
    detail = html`<pre>${Object.entries(detail)
      .map(([name,value])=>`${name}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`).join('\n')
    }</pre>`;

  return html`
    <div class="detail flex flex-gap">${detail}</div>
  `
}

export default function tile(title, status, okness='unknown', fx=undefined) {
  let handler = ()=>{};
  let detail = '';
  if (typeof fx === 'function') {
    handler = fx;
  } else if (fx || status instanceof Array) {
    handler = (e)=>{
      if (e.target.classList?.contains('swipe')) {
        const rect = e.target.getBoundingClientRect();
        const dist = (e.clientX - rect.left) / e.target.clientWidth;
        const direction = dist > 0.5 ? 1 : -1;
        e.target.scrollBy(direction * e.target.clientWidth, 0);
        return;
      }
      if (e.composedPath().find(e=>e.classList?.contains('detail'))) return;
      const element = e.composedPath().find(e=>e.classList?.contains('tile'));
      fx || status instanceof Array ? element.classList.toggle('expand') : element.classList.remove('expand');
    }
    detail = fx;
  }

  let scrollHandler = ()=>{}
  if (status instanceof Array) scrollHandler = (e)=>{
    var styles = getComputedStyle(e.target);
    var scrollElement = parseInt(styles.getPropertyValue('--scroll-element') || '0');
    const newScrollElement = Math.round(e.target.scrollLeft / e.target.clientWidth);

    if (scrollElement === newScrollElement) return;
    e.target.style.setProperty('--scroll-element', newScrollElement);
    status[newScrollElement]?.[2]?.();
  };

  return status !== undefined?html`
    <div class=${classMap({tile: true, [okness]: true, expand: false})} @click=${handler}>
      <span class="title">${title}</span>
      ${status instanceof Array ? html`
        <div class="swipe" @scroll=${scrollHandler}>
          ${status.map(s=>s instanceof Array ? html`
            <div>
              <span class="value">${s[0]}</span>
              ${renderDetail(s[1])}
            </div>
          ` : html`
            <div>
              <span class="value">${s}</span>
            </div>
          `)}
        </div>
      ` : html`
        <span class="value">${status}</span>
        ${renderDetail(detail)}
      `}
    </div>
  `:html``;
}
