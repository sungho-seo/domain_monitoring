// js/table/render.js
import { state } from '../state.js';
import { ROWS_PER_VIEW } from '../config.js';

const riskPill = (risk) => {
  if (risk === 'critical') return `<span class="pill crit">높음</span>`;
  if (risk === 'warning')  return `<span class="pill warn">중간</span>`;
  return `<span class="pill ok">없음</span>`;
};

const aiPill = (risk) => {
  return (risk === 'normal')
    ? `<span class="pill good">정상</span>`
    : `<span class="pill bad">비정상</span>`;
};

const manualPill = (s) => {
  const t = String(s || '').trim().toLowerCase();
  if (!t)           return `<span class="pill neut">-</span>`;
  if (t === 'valid')   return `<span class="pill good">Valid</span>`;
  if (t === 'invalid') return `<span class="pill bad">Invalid</span>`;
  return `<span class="pill neut">${s}</span>`;
};

const rowTintClass = (v) => {
  if (v.simplified === 'Cert Expired')      return 'row-expired';
  if (v.simplified === 'Cert CN Mismatch')  return 'row-cn';
  if (v._risk === 'critical')               return 'row-critical';
  if (v._risk === 'warning')                return 'row-warning';
  return 'row-normal';
};

export function renderTable(){
  const tbody = document.querySelector('#table tbody');
  const view  = state.viewRows || [];
  if (!tbody) return;

  const rowsHTML = view.map(v => {
    const mismatch = v._mismatch
      ? `<span class="pill neut" style="background:#e0e7ff;color:#1e3a8a;">불일치</span>`
      : `-`;

    const rec = state.images?.latestMap?.get(v.host);
    const imgCell = rec
      ? `
        <button class="icon-btn shot-btn"
                title="스크린샷 새 탭으로 열기"
                data-img="${encodeURIComponent(rec.url)}"
                aria-label="이미지 보기">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"></rect>
            <circle cx="8" cy="12" r="2" fill="currentColor"></circle>
            <path d="M12 14l2-2 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>`
      : `
        <button class="icon-btn disabled" title="스크린샷 없음" disabled aria-disabled="true">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"></rect>
            <circle cx="8" cy="12" r="2" fill="currentColor"></circle>
            <path d="M12 14l2-2 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>`;

    const hostLink = (v.url || '').replace(/^https?:\/\//,'');
    const trClass  = rowTintClass(v);

    return `
      <tr class="${trClass}">
        <td><a href="${v.url}" target="_blank" rel="noopener">${hostLink}</a></td>
        <td>${riskPill(v._risk)}</td>
        <td><span class="badge">${v.simplified}</span></td>
        <td>${aiPill(v._risk)}</td>
        <td>${manualPill(v._manualStatus)}</td>
        <td>${mismatch}</td>
        <td>${v.advice}</td>
        <td>
          <button class="icon-btn raw-btn" title="원본" data-id="${v._id}" aria-label="원본 보기(돋보기)">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
            </svg>
          </button>
        </td>
        <td>${imgCell}</td>
      </tr>`;
  }).join('');

  tbody.innerHTML = rowsHTML;

  // 고정 높이(15행) 계산
  const wrap  = document.getElementById('tableWrap');
  const thead = document.querySelector('#table thead');
  const firstRow = tbody.querySelector('tr');

  if (wrap && thead && firstRow) {
    const rowH  = firstRow.getBoundingClientRect().height || 44;
    const headH = thead.getBoundingClientRect().height || 44;
    wrap.style.height = Math.ceil(rowH * ROWS_PER_VIEW + headH) + 'px';
  }
}
