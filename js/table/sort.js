// js/table/sort.js
import { state } from '../state.js';
import { applyFilter } from './filters.js';

const keyMap = {
  0: 'url',
  1: '_risk',
  2: 'simplified',
  3: '_risk_ai',   // 내부 가상키
  4: '_manualStatus',
  5: '_mismatch',
  6: 'advice'
};

function getVal(row, key){
  if(key==='_risk_ai'){ return row._risk==='normal' ? '정상' : '비정상'; }
  return row[key];
}
function cmp(a,b){
  if(a==null && b==null) return 0;
  if(a==null) return -1; if(b==null) return 1;
  const na = (''+a).toLowerCase(); const nb = (''+b).toLowerCase();
  if(na<nb) return -1; if(na>nb) return 1; return 0;
}

export function bindSort(){
  const ths = document.querySelectorAll('#table thead th');
  ths.forEach((th, idx)=>{
    th.classList.add('sortable');
    th.addEventListener('click', ()=>{
      const key = keyMap[idx];
      if(!key) return;
      const dir = (state.sort.key===key && state.sort.dir==='asc') ? 'desc' : 'asc';
      state.sort = { key, dir };
      ths.forEach(t=>t.classList.remove('sort-asc','sort-desc'));
      th.classList.add(dir==='asc'?'sort-asc':'sort-desc');
      applyFilter(); // 정렬까지 포함되어 렌더됨
    });
  });
}

export function sortInPlace(arr){
  const { key, dir } = state.sort;
  if(!key) return;
  arr.sort((a,b)=>{
    const av = getVal(a, key), bv = getVal(b, key);
    const r = cmp(av, bv);
    return dir==='asc' ? r : -r;
  });
}
