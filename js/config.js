// config.js
export const PATHS = (date) => ({
  // 입력 원본(그대로 유지: 날짜 선택으로 로딩)
  inputs: [
    `../data/${date}/lge.com.csv`,
    `../data/${date}/lge.co.kr.csv`,
    `../data/${date}/lgthinq.com.csv`,
  ],
  // SSL 분석 결과(자동 탐색: reclassified 우선, 없으면 raw)
  auditReclassified: `../output/${date}/ssl_audit_result_reclassified.csv`,
  auditRaw:          `../output/${date}/ssl_audit_result.csv`,
});
