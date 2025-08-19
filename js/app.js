// js/app.js
import { CSV_FALLBACK, RUNS_SOURCE, csvPath } from './config.js';
import { state } from './state.js';
import { fetchText, fetchJSON } from './net.js';
import { parseCSV, buildView } from './csv.js';
import { loadImageIndex } from './images/indexer.js';
import { renderShotsStream } from './images/stream.js';
import { setupTabs } from './ui/tabs.js';
import { bindFilterButtons, applyFilter } from './table/filters.js';
import { bindSearch } from './table/search.js';
import { renderTable } from './table/render.js';
import { setKPIs } from './kpi.js';
import { openRawView, closeRawView } from './table/rawViewer.js';

const byId = id => document.getElementById(id);
const DEFAULT_DOMAIN = 'lge.com';  // 도메인은 고정(요청에 따라 나중에 UI 다시 붙일 수 있음)
let RUNS = [''];                   // runs.json 없으면 레거시 경로 사용

function prettyRun(run){
  if(!run) return '(기본)';
  return /^\d{8}$/.test(run) ? `${run.slice(0,4)}-${run.slice(4,6)}-${run.slice(6,8)}` : run;
}

/* runs.json이 없을 때 data/ 디렉터리 인덱스를 파싱해서 날짜 폴더(YYYYMMDD)를 자동 수집 */
async function discoverRunsFromDir(){
  try{
    const html = await fetchText('data/');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const names = Array.from(doc.querySelectorAll('a[href]'))
      .map(a=>decodeURIComponent((a.getAttribute('href')||'').replace(/\/?(\?.*)?$/,'')))
      .map(n=>n.replace(/\/$/,''))
      .filter(n=>/^\d{8}$/.test(n));
    const uniq = [...new Set(names)];
    return uniq.sort((a,b)=>b.localeCompare(a)); // 최신 먼저
  }catch{
    return [];
  }
}

async function loadRuns(){
  try{
    const arr = await fetchJSON(RUNS_SOURCE);
    if(Array.isArray(arr) && arr.length){
      RUNS = arr.sort((a,b)=>b.localeCompare(a));
      return;
    }
    throw new Error('empty runs.json');
  }catch{
    const guessed = await discoverRunsFromDir();
    RUNS = guessed.length ? guessed : ['']; // 아무 것도 없으면 레거시 모드
  }
}

function populateRunSelect(){
  const runSel = byId('runSelect');
  runSel.innerHTML = RUNS.map(r => `<option value="${r}">${prettyRun(r)}</option>`).join('');
  state.currentRun = runSel.value = RUNS[0] || '';
}

async function loadDataset(run){
  const domain = DEFAULT_DOMAIN;     // 고정
  state.currentDS = domain;
  state.currentRun = run;

  // CSV 로딩
  let rows = [];
  try{
    if(run){
      const text = await fetchText(csvPath(domain, run));
      rows = parseCSV(text);
    }else{
      const fb = CSV_FALLBACK[domain]?.[0];
      if(!fb) throw new Error('fallback path missing');
      const text = await fetchText(fb);
      rows = parseCSV(text);
    }
  }catch(e){
    console.error('[CSV] 로드 실패:', e);
    rows = [];
  }

  window.__BASE_VIEW__ = buildView(rows);
  state.viewRows = window.__BASE_VIEW__;

  // 이미지 인덱스 (도메인+날짜)
  state.images = await loadImageIndex(domain, run);

  setKPIs();
  renderTable();
  applyFilter();
}

function bindGlobal(){
  // 날짜 변경 → 재로딩
  byId('runSelect').addEventListener('change', (e)=>{
    loadDataset(e.target.value);
  });

  // 표 안의 버튼들
  document.addEventListener('click',(e)=>{
    const rawBtn = e.target.closest('button.raw-btn[data-id]');
    if(rawBtn){
      const id = Number(rawBtn.getAttribute('data-id'));
      const item = state.viewRows.find(v=>v._id===id);
      if(item){ const tr=rawBtn.closest('tr'); openRawView(item._raw,id,item.url,tr); }
      return;
    }
    const shotBtn = e.target.closest('button.shot-btn[data-img]');
    if(shotBtn){ window.open(decodeURIComponent(shotBtn.getAttribute('data-img')),'_blank','noopener'); return; }
  });

  // Home / ESC
  byId('btnHome').addEventListener('click',()=>{
    const topEl=document.querySelector('.tabsbar');
    (topEl||document.body).scrollIntoView({behavior:'smooth',block:'start'});
  });
  byId('closeRaw').addEventListener('click', closeRawView);
  window.addEventListener('keydown',(ev)=>{ if(ev.key==='Escape') closeRawView(); });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  setupTabs({ onEnterShots: ()=> renderShotsStream(byId('shotsStream'), state.images) });
  bindFilterButtons();
  bindSearch();
  bindGlobal();

  await loadRuns();        // 날짜 목록 확보 (runs.json 또는 디렉터리 스캔)
  populateRunSelect();     // 드롭다운 채우기

  await loadDataset(byId('runSelect').value);   // 초기 로딩
});
