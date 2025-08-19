// js/table/filters.js
import { state } from '../state.js';
import { renderTable } from './render.js';
import { sortInPlace } from './sort.js';
import { markKPIActive } from '../kpi.js';

export function bindFilterButtons(){
  document.addEventListener('click', function(e){
    const fbtn = e.target.closest('.filters .btn');
    if(!fbtn) return;
    Array.prototype.forEach.call(document.querySelectorAll('.filters .btn'), function(b){
      b.classList.remove('active');
    });
    fbtn.classList.add('active');
    state.activeFilter = fbtn.dataset.filter || 'all';

    // KPI 카드 active 하이라이트 동기화
    markKPIActive(state.activeFilter);
    applyFilter();
  });
}

export function applyFilter(){
  // 항상 원본에서 시작
  var view = (state.baseRows || []).slice();

  // 필터
  if(state.activeFilter==='normal') view = view.filter(function(v){ return v._risk==='normal'; });
  if(state.activeFilter==='abnormal') view = view.filter(function(v){ return v._risk!=='normal'; });
  if(state.activeFilter==='warning') view = view.filter(function(v){ return v._risk==='warning'; });
  if(state.activeFilter==='critical') view = view.filter(function(v){ return v._risk==='critical'; });
  if(state.activeFilter==='ssl-expired') view = view.filter(function(v){ return v.simplified==='Cert Expired'; });
  if(state.activeFilter==='ssl-cn') view = view.filter(function(v){ return v.simplified==='Cert CN Mismatch'; });
  if(state.activeFilter==='manual-invalid') view = view.filter(function(v){ return (String(v._manualStatus||'').toLowerCase()==='invalid'); });
  if(state.activeFilter==='mismatch') view = view.filter(function(v){ return !!v._mismatch; });
  if(state.activeFilter==='has-screenshot') view = view.filter(function(v){ return state.images.latestMap.has(v.host); });

  // 검색
  if(state.searchQuery){
    const q = state.searchQuery.toLowerCase();
    view = view.filter(function(v){
      return (
        (v.url||'').toLowerCase().includes(q) ||
        (String(v._manualStatus||'')).toLowerCase().includes(q) ||
        (v.simplified||'').toLowerCase().includes(q) ||
        (v._risk||'').toLowerCase().includes(q) ||
        (v.advice||'').toLowerCase().includes(q) ||
        JSON.stringify(v._raw||{}).toLowerCase().includes(q)
      );
    });
  }

  // 정렬
  sortInPlace(view);

  state.viewRows = view;
  renderTable(); // KPI는 baseRows 기준이므로 여기서 재계산하지 않음
}
