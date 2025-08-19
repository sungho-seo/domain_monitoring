const re={
  expired: /(cert_has_expired|certificate has expired|err_cert_date_invalid|x509:\s*certificate has expired)/i,
  altname: /(err_tls_cert_altname_invalid|common_name_invalid|cn mismatch)/i,
  verifyfail: /(unable_to_verify_leaf_signature|self-?signed)/i,
  notyet: /cert_not_yet_valid/i, genericSSL: /\b(ssl|certificate|tls)\b/i,
  timeout:/timeout/i, refused:/(econnrefused|connection refused)/i, reset:/(econnreset)/i, aborted:/econnaborted/i,
  unreachable:/(ehostunreach|enetunreach)/i, hangup:/socket hang up/i,
  dnsnotfound:/(enotfound|nxdomain|getaddrinfo enotfound|dns lookup)/i,
  http200:/^\s*200\b|\b200 ok\b/i, http3xx:/^\s*3\d\d\b/i,
  http403:/^\s*403\b|forbidden/i, http404:/^\s*404\b|not found/i,
  http500:/^\s*500\b|internal server error/i, http502:/^\s*502\b|bad gateway/i,
  http503:/^\s*503\b|service unavailable/i, http504:/^\s*504\b|gateway timeout/i, http2xx:/^\s*2\d\d\b/i,
};

export function simplifyByText(text=''){
  const t=String(text||'').trim();
  if(!t||t==="'"||t.toLowerCase()==='none') return 'OK';
  if(re.expired.test(t)) return 'Cert Expired';
  if(re.altname.test(t)) return 'Cert CN Mismatch';
  if(re.verifyfail.test(t)) return 'Cert Verify Fail';
  if(re.notyet.test(t)) return 'Cert Not Valid Yet';
  if(re.timeout.test(t)) return 'Timeout';
  if(re.refused.test(t)) return 'Closed';
  if(re.reset.test(t)) return 'Conn Reset';
  if(re.aborted.test(t)) return 'Aborted';
  if(re.unreachable.test(t)) return 'Host Unreachable';
  if(re.hangup.test(t)) return 'Socket Hangup';
  if(re.dnsnotfound.test(t)) return 'DNS Not Found';
  if(re.http200.test(t) || re.http3xx.test(t) || re.http2xx.test(t)) return 'OK';
  if(re.http403.test(t)) return 'Forbidden (403)';
  if(re.http404.test(t)) return 'Not Found (404)';
  if(re.http500.test(t)) return 'Server Error (500)';
  if(re.http502.test(t)) return 'Bad Gateway (502)';
  if(re.http503.test(t)) return 'Service Unavailable (503)';
  if(re.http504.test(t)) return 'Gateway Timeout (504)';
  if(re.genericSSL.test(t)) return 'SSL Issue';
  return t;
}

export function categorize(s){
  if(s.startsWith('Cert ')||s.includes('SSL')) return 'SSL';
  if(['Timeout','Closed','Conn Reset','Aborted','Socket Hangup','Host Unreachable'].includes(s)) return 'Connection';
  if(s==='DNS Not Found') return 'DNS';
  if(/(Server Error|Forbidden|Not Found|Bad Gateway|Service Unavailable|Gateway Timeout|OK)/.test(s)) return 'HTTP';
  return 'Other';
}

export function riskLevel(s){
  if(['Cert Expired','Cert CN Mismatch','Closed','Host Unreachable','DNS Not Found'].includes(s)) return 'critical';
  if(['Timeout','Conn Reset','Aborted','Socket Hangup','SSL Issue','Cert Verify Fail','Cert Not Valid Yet',
      'Server Error (500)','Forbidden (403)','Not Found (404)','Bad Gateway (502)','Service Unavailable (503)','Gateway Timeout (504)'].includes(s)) return 'warning';
  if(s==='OK') return 'normal';
  return 'normal';
}

export function recommend(s){
  const map={
    'Cert Expired':'인증서 갱신 및 배포 (즉시)','Cert CN Mismatch':'인증서 SAN 포함 재발급 (도메인 불일치)','Cert Verify Fail':'체인/중간 인증서 점검',
    'Cert Not Valid Yet':'서버 시간/배포 시점 확인','SSL Issue':'SSL/TLS 구성 전수 점검','Host Unreachable':'라우팅/방화벽 경로 점검',
    'Closed':'서비스 포트/방화벽 확인','Conn Reset':'서버 오류/프록시 종료 확인','Timeout':'오리진 응답 지연, 타임아웃/헬스체크 확인',
    'Aborted':'네트워크 중간 차단 확인','Socket Hangup':'백엔드 연결 종료 확인','DNS Not Found':'DNS 레코드 존재/만료/전파 상태 확인',
    'Server Error (500)':'애플리케이션/백엔드 오류 로그 확인','Forbidden (403)':'접근 정책/인증 정책 점검','Not Found (404)':'배포 경로/리소스 존재 확인',
    'Bad Gateway (502)':'업스트림/프록시 연결 상태 확인','Service Unavailable (503)':'오토스케일/헬스체크/자원 상태 점검','Gateway Timeout (504)':'백엔드 응답 지연/네트워크 경로 점검',
    'OK':'모니터링'
  };
  return map[s] || '모니터링';
}
