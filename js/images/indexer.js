// js/images/indexer.js
import { fetchText, fetchJSON } from '../net.js';
import { imgDir } from '../config.js';

const IMG_RE=/^(?<ts>\d{8}_\d{6})__(?<host>[a-z0-9.-]+)__(?<status>[A-Z0-9_]+)(?:-(?<label>[A-Za-z0-9._-]+))?\.png$/;

// 캐시 키를 domain|run 으로 분리
const cache = new Map(); // key: `${domain}|${run||''}` -> { latestMap, all }

export async function loadImageIndex(domain, run){
  const key = `${domain}|${run||''}`;
  if(cache.has(key)) return cache.get(key);

  const dir = imgDir(domain, run);

  async function fromDirIndex(){
    const html = await fetchText(dir);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const files = Array.from(doc.querySelectorAll('a[href]'))
      .map(a=>a.getAttribute('href')||'')
      .map(h=>decodeURIComponent(h.split('?')[0]))
      .filter(h=>/\.png$/i.test(h) && !h.endsWith('/'));
    return buildIndex(files, dir);
  }
  async function fromManifest(){
    const arr = await fetchJSON(dir + 'manifest.json');
    return buildIndex(Array.isArray(arr)?arr:[], dir);
  }
  function buildIndex(files, dir){
    const latestMap = new Map(); const all = [];
    for(const fname of files){
      const base = fname.split('/').pop();
      const m = base.match(IMG_RE); if(!m) continue;
      const { ts, host, status, label } = m.groups;
      const rec = { ts, host, status, label:(label||''), filename:base, url:dir+base };
      all.push(rec);
      const prev = latestMap.get(host); if(!prev || ts > prev.ts) latestMap.set(host, rec);
    }
    all.sort((a,b)=> b.ts.localeCompare(a.ts));
    return { latestMap, all };
  }

  let idx = { latestMap:new Map(), all:[] };
  try { idx = await fromDirIndex(); }
  catch {
    try { idx = await fromManifest(); }
    catch { /* keep empty */ }
  }
  cache.set(key, idx);
  return idx;
}
