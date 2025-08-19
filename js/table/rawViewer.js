// js/table/rawViewer.js
import { state } from '../state.js';

let currentIndex = -1;

function fillKV(el, obj){
  const entries = Object.entries(obj || {});
  el.innerHTML = entries.map(([k,v]) =>
    `<div class="k">${k}</div><div class="v">${String(v)}</div>`
  ).join('') || '<div class="v" style="grid-column:1/-1;color:#9ca3af">표시할 항목이 없습니다.</div>';
}

function setTab(modal, name){
  modal.querySelectorAll('.dm-tabs .tab').forEach(b=>{
    const on = b.dataset.pane===name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true':'false');
  });
  modal.querySelectorAll('.dm-content .pane').forEach(p=>{
    p.classList.toggle('active', p.dataset.pane===name);
  });
}

export function openRawView(raw, id, url, tr){
  const modal = document.getElementById('rawModal');
  const link  = document.getElementById('modalLink');
  const kv    = document.getElementById('modalKV');
  const json  = document.getElementById('modalJSON');
  const shot  = document.getElementById('modalShotWrap');

  // 표 행 하이라이트
  document.querySelectorAll('#table tbody tr.selected').forEach(n=>n.classList.remove('selected'));
  if(tr) tr.classList.add('selected');

  // 현재 인덱스
  const idx = state.viewRows.findIndex(v=>v._id===id);
  currentIndex = idx;

  // 제목/링크
  link.href = url || '#';
  link.textContent = (url||'').replace(/^https?:\/\//,'');

  // 개요(KV)
  fillKV(kv, raw);

  // JSON
  try{
    json.textContent = JSON.stringify(raw||{}, null, 2);
  }catch{ json.textContent = String(raw||''); }

  // 스크린샷
  shot.innerHTML = '';
  const host = state.viewRows[idx]?.host;
  const rec  = state.images?.latestMap?.get(host);
  if(rec){
    shot.innerHTML = `
      <a href="${rec.url}" target="_blank" rel="noopener">
        <img src="${rec.url}" alt="${host}">
      </a>
      <div class="shot-filename" style="margin-top:6px;color:#6b7280">${rec.filename}</div>`;
  }else{
    shot.innerHTML = `<div style="color:#9ca3af">이 도메인의 스크린샷이 없습니다.</div>`;
  }

  // 기본 탭: 개요
  setTab(modal, 'overview');

  // 모달 열기
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.getElementById('modalClose')?.focus();
}

export function closeRawView(){
  const modal = document.getElementById('rawModal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

function goto(offset){
  const next = currentIndex + offset;
  if(next<0 || next>=state.viewRows.length) return;
  const v  = state.viewRows[next];
  const tr = document.querySelector(`#table tbody tr:nth-child(${next+1})`);
  openRawView(v._raw, v._id, v.url, tr);
}

export function bindRawModal(){
  const modal   = document.getElementById('rawModal');
  const closeBt = document.getElementById('modalClose');
  const prevBt  = document.getElementById('modalPrev');
  const nextBt  = document.getElementById('modalNext');
  const back    = modal.querySelector('.dm-backdrop');

  // 탭
  modal.querySelector('.dm-tabs').addEventListener('click', (e)=>{
    const b = e.target.closest('.tab'); if(!b) return;
    setTab(modal, b.dataset.pane);
  });

  // 네비게이션/닫기
  prevBt.addEventListener('click', ()=> goto(-1));
  nextBt.addEventListener('click', ()=> goto(1));
  closeBt.addEventListener('click', closeRawView);
  back.addEventListener('click', closeRawView);

  // 키보드
  window.addEventListener('keydown', (ev)=>{
    if(!modal.classList.contains('open')) return;
    if(ev.key==='Escape') closeRawView();
    if(ev.key==='ArrowLeft') goto(-1);
    if(ev.key==='ArrowRight') goto(1);
  });
}
