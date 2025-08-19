// js/config.js

export const CACHE_BUST = () => 'v=' + Date.now();
export const ROWS_PER_VIEW = 15;

export const CSV_FALLBACK = {
  "lge.com":   ["data/lge.com.csv"],
  "lge.co.kr": ["data/lge.co.kr.csv"],
  "lgthinq.com": ["data/lgthinq.com.csv"]
};

// runs.json 위치 (["20250814","20250821", ...])
export const RUNS_SOURCE = 'data/runs.json';

// 경로 생성기: run 값이 있으면 날짜별 경로로, 없으면 구(舊) 단일 파일 경로로
export const csvPath = (domain, run) =>
  run ? `data/${run}/${domain}.csv` : `data/${domain}.csv`;

export const imgDir = (domain, run) =>
  run ? `images/img.${domain}/${run}/` : `images/img.${domain}/`;
