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
import { bindSort } from './table/sort.js';
import { toast } from './ui/notify.js';
import { spinnerOn, spinnerOff } from './ui/spinner.js';

const byId = id => document.getElementById(id);
const DEFAULT_DOMAIN = 'lge.com';
let RUNS = [''];

function prettyRun(run){
  if(!run) return '(기본)';
  return /^\d{8}$/.test(run) ? `${run.slice(0,4)}-${run.slice(4,6)}-${run.slice(6,8)}` : run;
}

async function discoverRunsFromDir(){
  try{
    const html = await fetchText('data/');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const names = Array.from(doc.querySelectorAll('a[href]'))
      .map(a=>decodeURIComponent((a.getAttribute('href')||'').replace(/\/?(\?.*)?$/,'')))
      .map(n=>n.replace(/\/$/,''))
      .filter(n=>/^\d{8}$/.test(n));
    const uniq = [...new Set(names)];
    return uniq.sort((a,b)=>b.localeCompare(a));
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
    RUNS = guessed.length ? guessed : [''];
    if(!guessed.length){
      toast('runs.json이 없고 data/ 폴더에서 날짜를 찾지 못했어요. (기본 경로 모드)', 'warn', 4500);
    }
  }
}

function populateRunSelect(){
  const runSel = byId('runSelect');
  const last = localStorage.getItem('dm:lastRun');
  runSel.innerHTML = RUNS.map(r => `<option value="${r}">${prettyRun(r)}</option>`).join('');
  const initial = (last && RUNS.includes(last)) ? last : (RUNS[0] || '');
  state.currentRun = runSel.value = initial;
}

async function loadDataset(run){
  state.currentDS = DEFAULT_DOMAIN;
  state.currentRun = run;
  localStorage.setItem('dm:lastRun', run || '');

  // 스피너 on
  const tableHost = document.getElementById('tab-domains') || document.body;
  spinnerOn('table', tableHost);

  // CSV
  let rows = []; let note = '';
  try{
    if(run){
      const text = await fetchText(csvPath(DEFAULT_DOMAIN, run));
      rows = parseCSV(text);
      if(!rows.length) note = `CSV가 비어 있거나 파싱된 행이 없습니다. (run=${prettyRun(run)})`;
    }else{
      const fb = CSV_FALLBACK[DEFAULT_DOMAIN]?.[0];
      const text = await fetchText(fb);
      rows = parseCSV(text);
      if(!rows.length) note = `CSV가 비어 있거나 파싱된 행이 없습니다. (기본 경로)`;
    }
  }catch(e){
    console.error('[CSV] 로드 실패:', e);
    toast('CSV를 불러오지 못했습니다. 경로/권한/파일명을 확인하세요.', 'error', 5000);
    note = 'CSV 로딩 실패: 경로 또는 권한 문제일 수 있습니다.';
    rows = [];
  }

  state.loadNote = note;
  window.__BASE_VIEW__ = buildView(rows);
  state.viewRows = window.__BASE_VIEW__;

  // 이미지 index
  try{
    state.images = await loadImageIndex(DEFAULT_DOMAIN, run);
    if(!state.images.all.length){
      toast('이 날짜에 스크린샷(manifest)이 없거나 비어 있습니다.', 'warn', 4000);
    }
  }catch(e){
    console.warn('[IMG] 인덱스 실패:', e);
    toast('스크린샷 목록을 불러오지 못했습니다(manifest 혹은 디렉터리 인덱스).', 'error', 5000);
    state.images = { latestMap:new Map(), all:[] };
  }

  setKPIs();
  renderTable();
  bindSort();     // 머리글 정렬 바인딩(최초 1회 호출해도 무방하지만 안전하게 갱신)
  applyFilter();

  spinnerOff('table');
}

function bindGlobal(){
  // 날짜 변경 → 재로딩
  byId('runSelect').addEventListener('change', (e)=> loadDataset(e.target.value));

  // 표 버튼들
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
  setupTabs({
    onEnterShots: ()=> {
      const host = document.getElementById('tab-shots') || document.body;
      spinnerOn('shots', host);
      setTimeout(()=>{
        renderShotsStream(document.getElementById('shotsStream'), state.images);
        spinnerOff('shots');
      }, 0);
    }
  });
  bindFilterButtons();
  bindSearch();
  bindGlobal();

  await loadRuns();
  populateRunSelect();
  await loadDataset(byId('runSelect').value);
});
