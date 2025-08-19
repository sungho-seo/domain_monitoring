// js/state.js
export const state = {
  currentDS: 'lge.com',
  currentRun: '',
  rawRows: [],
  viewRows: [],
  images: { latestMap: new Map(), all: [] },
  activeFilter: 'all',
  searchQuery: '',
  sort: { key: '', dir: 'asc' },  // ← 추가
  loadNote: ''                     // ← CSV 읽기 실패 등 안내 메시지
};
