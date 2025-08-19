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
import { openRawView, closeRawView, bindRawModal } from './table/rawViewer.js';
import { bindSort } from './table/sort.js';
import { toast } from './ui/notify.js';
import { spinnerOn, spinnerOff } from './ui/spinner.js';

const byId = id => document.getElementById(id);

let RUNS = [''];                                  // runs.json 없으면 레거시 모드
let DOMAINS = Object.keys(CSV_FALLBACK || {});    // ["lge.com","lge.co.kr","lgthinq.com"]

function prettyRun(run){
  if(!run) return '(기본)';
  return /^\d{8}$/.test(run) ? `${run.slice(0,4)}-${run.slice(4,6)}-${run.slice(6,8)}` : run;
}

/** runs.json이 없으면 data/ 디렉터리 인덱스에서 날짜 폴더(YYYYMMDD) 자동 탐색 */
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
    RUNS = guessed.length ? guessed : [''];
    if(!guessed.length){
      toast('runs.json이 없고 data/ 폴더에서 날짜를 찾지 못했어요. (기본 경로 모드)', 'warn', 4500);
    }
  }
}

function populateSelectors(){
  // 날짜
  const runSel = byId('runSelect');
  const lastRun = localStorage.getItem('dm:lastRun');
  runSel.innerHTML = RUNS.map(r => `<option value="${r}">${prettyRun(r)}</option>`).join('');
  state.currentRun = runSel.value = (lastRun && RUNS.includes(lastRun)) ? lastRun : (RUNS[0] || '');

  // 도메인
  if(!DOMAINS.length){ DOMAINS = ['lge.com']; }
  const dsSel = byId('dsSelect');
  const lastDom = localStorage.getItem('dm:lastDomain');
  dsSel.innerHTML = DOMAINS.map(d => `<option value="${d}">${d}</option>`).join('');
  state.currentDS = dsSel.value = (lastDom && DOMAINS.includes(lastDom)) ? lastDom : (DOMAINS[0] || 'lge.com');
}

async function loadDataset(domain, run){
  state.currentDS = domain;
  state.currentRun = run;
  localStorage.setItem('dm:lastDomain', domain);
  localStorage.setItem('dm:lastRun', run || '');

  // 테이블 스피너 on
  const tableHost = document.getElementById('tab-domains') || document.body;
  spinnerOn('table', tableHost);

  // CSV 로딩
  let rows = []; let note = '';
  try{
    if(run){
      const text = await fetchText(csvPath(domain, run));
      rows = parseCSV(text);
      if(!rows.length) note = `CSV가 비어 있거나 파싱된 행이 없습니다. (${domain}, ${prettyRun(run)})`;
    }else{
      const fb = CSV_FALLBACK[domain]?.[0];
      const text = await fetchText(fb);
      rows = parseCSV(text);
      if(!rows.length) note = `CSV가 비어 있거나 파싱된 행이 없습니다. (${domain}, 기본 경로)`;
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

  // 이미지 index (도메인+날짜)
  try{
    state.images = await loadImageIndex(domain, run);
    const shotsActive = document.getElementById('tab-shots')?.classList.contains('active');
    if(shotsActive){
      const host = document.getElementById('tab-shots') || document.body;
      spinnerOn('shots', host);
      renderShotsStream(document.getElementById('shotsStream'), state.images);
      spinnerOff('shots');
      // 스크린샷 탭에서 Home 버튼 보이기
      const home = document.getElementById('btnHome');
      if (home) home.classList.add('active');
    }
  }catch(e){
    console.warn('[IMG] 인덱스 실패:', e);
    toast('스크린샷 목록을 불러오지 못했습니다(manifest 혹은 디렉터리 인덱스).', 'error', 5000);
    state.images = { latestMap:new Map(), all:[] };
  }

  setKPIs();
  renderTable();
  bindSort();     // 헤더 정렬 바인딩(필요 시 갱신)
  applyFilter();

  spinnerOff('table');
}

function bindGlobal(){
  // 날짜/도메인 변경 → 재로딩
  byId('runSelect').addEventListener('change', ()=>{
    loadDataset(byId('dsSelect').value, byId('runSelect').value);
  });
  byId('dsSelect').addEventListener('change', ()=>{
    loadDataset(byId('dsSelect').value, byId('runSelect').value);
  });

  // 표 버튼들
  document.addEventListener('click',(e)=>{
    const rawBtn = e.target.closest('button.raw-btn[data-id]');
    if(rawBtn){
      const id = Number(rawBtn.getAttribute('data-id'));
      const item = state.viewRows.find(v=>v._id===id);
      if(item){
        const tr=rawBtn.closest('tr');
        openRawView(item._raw, id, item.url, tr);   // 모달 오픈
      }
      return;
    }
    const shotBtn = e.target.closest('button.shot-btn[data-img]');
    if(shotBtn){
      window.open(decodeURIComponent(shotBtn.getAttribute('data-img')),'_blank','noopener');
      return;
    }
  });

  // Home / ESC(모달 ESC는 rawViewer.js에서 처리)
  byId('btnHome').addEventListener('click',()=>{
    const topEl=document.querySelector('.tabsbar');
    (topEl||document.body).scrollIntoView({behavior:'smooth',block:'start'});
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  setupTabs({
    onEnterShots: ()=> {
      const host = document.getElementById('tab-shots') || document.body;
      spinnerOn('shots', host);
      renderShotsStream(document.getElementById('shotsStream'), state.images);
      spinnerOff('shots');
      // 스크린샷 탭에서 Home 플로팅 버튼 표시
      const home = document.getElementById('btnHome');
      if (home) home.classList.add('active');
    }
  });

  bindFilterButtons();
  bindSearch();
  bindGlobal();
  bindRawModal();     // ★ 모달 초기화

  await loadRuns();           // 날짜 목록 먼저
  populateSelectors();        // 날짜/도메인 드롭다운 채우기 (localStorage 복원)
  await loadDataset(byId('dsSelect').value, byId('runSelect').value); // 초기 로딩
});
