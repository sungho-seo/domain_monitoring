// js/kpi.js
import { state } from './state.js';

function pct(n, d){
  if(!d) return '-';
  return Math.round((n/d)*1000)/10 + '%';
}
function $(s){ return document.querySelector(s); }

export function setKPIs(){
  const base = state.baseRows || window.__BASE_VIEW__ || [];
  const total = base.length;

  const normal   = base.filter(function(v){ return v._risk==='normal'; }).length;
  const warning  = base.filter(function(v){ return v._risk==='warning'; }).length;
  const critical = base.filter(function(v){ return v._risk==='critical'; }).length;
  const expired  = base.filter(function(v){ return v.simplified==='Cert Expired'; }).length;
  const cnmis    = base.filter(function(v){ return v.simplified==='Cert CN Mismatch'; }).length;
  const mismatch = base.filter(function(v){ return !!v._mismatch; }).length;

  if($('#kpi-total'))        $('#kpi-total').textContent        = String(total);
  if($('#kpi-normal'))       $('#kpi-normal').textContent       = String(normal);
  if($('#kpi-warning'))      $('#kpi-warning').textContent      = String(warning);
  if($('#kpi-critical'))     $('#kpi-critical').textContent     = String(critical);
  if($('#kpi-ssl-expired'))  $('#kpi-ssl-expired').textContent  = String(expired);
  if($('#kpi-ssl-cn'))       $('#kpi-ssl-cn').textContent       = String(cnmis);
  if($('#kpi-mismatch'))     $('#kpi-mismatch').textContent     = String(mismatch);

  if($('#kpi-total-sub'))        $('#kpi-total-sub').textContent        = '-';
  if($('#kpi-normal-sub'))       $('#kpi-normal-sub').textContent       = pct(normal, total);
  if($('#kpi-warning-sub'))      $('#kpi-warning-sub').textContent      = pct(warning, total);
  if($('#kpi-critical-sub'))     $('#kpi-critical-sub').textContent     = pct(critical, total);
  if($('#kpi-ssl-expired-sub'))  $('#kpi-ssl-expired-sub').textContent  = pct(expired, total);
  if($('#kpi-ssl-cn-sub'))       $('#kpi-ssl-cn-sub').textContent       = pct(cnmis, total);
  if($('#kpi-mismatch-sub'))     $('#kpi-mismatch-sub').textContent     = pct(mismatch, total);
}

// KPI 카드 active 표시 토글
export function markKPIActive(filter){
  const cards = document.querySelectorAll('.kpis .card.kpi');
  Array.prototype.forEach.call(cards, function(c){ c.classList.remove('active'); });

  const kpiKeys = ['all','normal','warning','critical','ssl-expired','ssl-cn','mismatch'];
  if(kpiKeys.indexOf(filter) >= 0){
    const sel = '.kpis .card.kpi[data-filter="'+filter+'"]';
    const card = document.querySelector(sel);
    if(card) card.classList.add('active');
  }
}

// ===== 클릭 타깃 탐색 유틸 =====
function getCardAt(x,y){
  if(typeof document.elementsFromPoint !== 'function') return null;
  const list = document.elementsFromPoint(x,y) || [];
  for(let i=0;i<list.length;i++){
    const el = list[i];
    if(el && el.matches && el.matches('.kpis .card.kpi[data-filter]')) return el;
  }
  return null;
}
function findCardFromEvent(e){
  // 1) 일반 버블/캡처 경로
  if(e.target && e.target.closest){
    const c = e.target.closest('.kpis .card.kpi[data-filter]');
    if(c) return c;
  }
  // 2) 좌표 기반(오버레이가 타깃이어도 하부 카드 검색)
  if(typeof e.clientX === 'number' && typeof e.clientY === 'number'){
    const c2 = getCardAt(e.clientX, e.clientY);
    if(c2) return c2;
  }
  // 3) composedPath (쉐도우 DOM 대비)
  if(typeof e.composedPath === 'function'){
    const path = e.composedPath();
    for(let i=0;i<path.length;i++){
      const n = path[i];
      if(n && n.matches && n.matches('.kpis .card.kpi[data-filter]')) return n;
    }
  }
  return null;
}
// data-filter 빠진 경우의 최소 추정(마크업 안전망)
function inferFilter(card){
  if(!card || !card.classList) return 'all';
  if(card.classList.contains('green'))  return 'normal';
  if(card.classList.contains('amber'))  return 'warning';
  if(card.classList.contains('red'))    return 'critical';
  if(card.classList.contains('purple')) return 'ssl-expired';
  if(card.classList.contains('blue')) {
    // 프로젝트 구조상 blue는 CN/SAN 혹은 불일치 두 카드에 쓰일 수 있음
    // data-filter 없으면 CN/SAN 우선
    return 'ssl-cn';
  }
  return 'all';
}

let _bound = false;
let _debounceTS = 0;

export function bindKPICards(){
  if(_bound) return;
  _bound = true;

  // 접근성 속성(시각적 변화 없음)
  const cards = document.querySelectorAll('.kpis .card.kpi');
  Array.prototype.forEach.call(cards, function(c){
    if(!c.hasAttribute('tabindex')) c.setAttribute('tabindex','0');
    if(!c.hasAttribute('role')) c.setAttribute('role','button');
  });

  function dispatchFilter(f){
    markKPIActive(f);
    document.dispatchEvent(new CustomEvent('dm:set-filter', { detail:{ filter:f } }));
  }
  function handle(e){
    // 중복 이벤트(클릭/포인터업 연달아 발생) 간단히 억제
    if(e.timeStamp && Math.abs(e.timeStamp - _debounceTS) < 120) return;
    const card = findCardFromEvent(e);
    if(!card) return;
    const f = card.getAttribute('data-filter') || inferFilter(card) || 'all';
    dispatchFilter(f);
    _debounceTS = e.timeStamp || (Date.now());
    e.preventDefault();
  }

  // 캡처 단계에서 선제 처리(오버레이 stopPropagation 회피)
  window.addEventListener('pointerup', handle, true);
  window.addEventListener('click', handle, true);
  document.addEventListener('pointerup', handle, true);
  document.addEventListener('click', handle, true);

  // 키보드 접근성
  document.addEventListener('keydown', function(e){
    if(e.key!=='Enter' && e.key!==' ') return;
    const el = document.activeElement;
    if(!el || !el.matches || !el.matches('.kpis .card.kpi')) return;
    const f = el.getAttribute('data-filter') || inferFilter(el) || 'all';
    dispatchFilter(f);
    e.preventDefault();
  }, true);

  // 최후 안전망: 각 카드에 직접 바인딩(버블 단계)
  Array.prototype.forEach.call(cards, function(c){
    c.addEventListener('click', function(ev){
      const f = c.getAttribute('data-filter') || inferFilter(c) || 'all';
      dispatchFilter(f);
      ev.preventDefault();
    });
  });
}
