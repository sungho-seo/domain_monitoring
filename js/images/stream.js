// js/images/stream.js
import { spinnerOn, spinnerOff } from '../ui/spinner.js';

function classifyStatus(rec){
  const s = (rec.status || '').toUpperCase();
  if(/^2\d\d/.test(s) || /200-?OK/.test(s)) return 'ok';
  if(/^403/.test(s) || /403-?FORBIDDEN/.test(s)) return '403';
  if(/CERT|SSL|TLS/.test(s)) return 'ssl';
  return 'other';
}

function ensureFilters(container, onChange){
  let bar = container.previousElementSibling;
  if(!bar || !bar.classList.contains('shots-filters')){
    bar = document.createElement('div');
    bar.className = 'shots-filters';
    bar.innerHTML = `
      <button class="btn active" data-f="all">전체</button>
      <button class="btn" data-f="ok">정상(2xx)</button>
      <button class="btn" data-f="403">403</button>
      <button class="btn" data-f="ssl">SSL</button>
      <button class="btn" data-f="other">기타</button>
    `;
    container.parentElement.insertBefore(bar, container);
  }
  bar.addEventListener('click', (e)=>{
    const b = e.target.closest('button.btn[data-f]');
    if(!b) return;
    bar.querySelectorAll('.btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    onChange(b.dataset.f);
  }, { once:false });
  return bar;
}

export function renderShotsStream(container, images, filter='all'){
  spinnerOn('shots', container.parentElement || container);

  const all = (images?.all || []).map(r => ({...r, _cls: classifyStatus(r)}));
  let list = all;
  if(filter!=='all'){ list = all.filter(x => x._cls === filter); }

  // 퀵 필터 바 보장
  ensureFilters(container, (f)=> renderShotsStream(container, images, f));

  // 초기화
  container.innerHTML = '';
  const total = list.length;
  let idx=0, num=1;
  const CHUNK=20;

  function appendChunk(){
    const frag=document.createDocumentFragment();
    for(let i=0;i<CHUNK && idx<list.length;i++,idx++,num++){
      const r=list[idx];
      const card=document.createElement('div');
      card.className='shot-card';
      card.setAttribute('data-host', r.host);
      card.id='shot-'+r.host+'-'+r.ts;
      card.innerHTML=
        `<div class="shot-meta">[${num}/${total}] ${r.host} · ${r.ts} · ${r.status}${r.label?' · '+r.label:''}</div>
         <a href="${r.url}" target="_blank" rel="noopener"><img loading="lazy" src="${r.url}" alt="${r.host} screenshot"></a>
         <div class="shot-filename">${r.filename}</div>`;
      frag.appendChild(card);
    }
    container.appendChild(frag);
  }

  appendChunk();
  const sentinel=document.createElement('div'); sentinel.style.height='1px'; container.appendChild(sentinel);
  const io=new IntersectionObserver((entries)=>{
    if(entries.some(en=>en.isIntersecting)){
      io.unobserve(sentinel);
      appendChunk();
      container.appendChild(sentinel);
      io.observe(sentinel);
    }
  },{threshold:0.1});
  io.observe(sentinel);

  spinnerOff('shots');
}
