// js/state.js
export const state = {
  currentDS: 'lge.com',
  currentRun: '',
  // 전체(원본) 데이터: KPI는 항상 이 기준으로 계산
  baseRows: [],
  // 화면 표시용 데이터: 필터/검색/정렬이 반영됨
  viewRows: [],
  // (이전 호환) 원시 파싱 보관소가 필요하면 사용
  rawRows: [],
  images: { latestMap: new Map(), all: [] },
  activeFilter: 'all',
  searchQuery: '',
  sort: { key: '', dir: 'asc' },
  loadNote: ''
};
