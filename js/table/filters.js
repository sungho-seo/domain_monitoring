import { state } from '../state.js';
import { renderTable } from './render.js';
import { setKPIs } from '../kpi.js';

export function bindFilterButtons(){
  document.addEventListener('click', async (e)=>{
    const fbtn=e.target.closest('.filters .btn');
    if(!fbtn) return;
    document.querySelectorAll('.filters .btn').forEach(b=>b.classList.remove('active'));
    fbtn.classList.add('active');
    state.activeFilter=fbtn.dataset.filter||'all';
    applyFilter();
  });
}

export function applyFilter(){
  let view=window.__BASE_VIEW__ || []; // 원본(필터/검색 전)
  // 필터
  if(state.activeFilter==='normal') view=view.filter(v=>v._risk==='normal');
  if(state.activeFilter==='abnormal') view=view.filter(v=>v._risk!=='normal');
  if(state.activeFilter==='warning') view=view.filter(v=>v._risk==='warning');
  if(state.activeFilter==='critical') view=view.filter(v=>v._risk==='critical');
  if(state.activeFilter==='ssl-expired') view=view.filter(v=>v.simplified==='Cert Expired');
  if(state.activeFilter==='ssl-cn') view=view.filter(v=>v.simplified==='Cert CN Mismatch');
  if(state.activeFilter==='manual-invalid') view=view.filter(v=>(v._manualStatus||'').toLowerCase()==='invalid');
  if(state.activeFilter==='mismatch') view=view.filter(v=>v._mismatch);
  if(state.activeFilter==='has-screenshot'){ view=view.filter(v=> state.images.latestMap.has(v.host)); }

  // 검색
  if(state.searchQuery){
    const q=state.searchQuery.toLowerCase();
    view=view.filter(v=>
      v.url.toLowerCase().includes(q) ||
      (v._manualStatus||'').toLowerCase().includes(q) ||
      v.simplified.toLowerCase().includes(q) ||
      v._risk.toLowerCase().includes(q) ||
      v.advice.toLowerCase().includes(q) ||
      JSON.stringify(v._raw||{}).toLowerCase().includes(q)
    );
  }

  // 적용
  state.viewRows=view;
  setKPIs();
  renderTable();
}
