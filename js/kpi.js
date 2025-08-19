import { state } from './state.js';

export function setKPIs(){
  const base=state.viewRows;
  const total=base.length;
  const normal=base.filter(v=>v._risk==='normal').length;
  const warning=base.filter(v=>v._risk==='warning').length;
  const critical=base.filter(v=>v._risk==='critical').length;
  const sslExpired=base.filter(v=>v.simplified==='Cert Expired').length;
  const sslCN=base.filter(v=>v.simplified==='Cert CN Mismatch').length;
  const mismatch=base.filter(v=>v._mismatch).length;
  const pct=n=>total?Math.round(n*100/total)+'%':'0%';
  document.getElementById('kpi-total').textContent=total;
  document.getElementById('kpi-normal').textContent=normal; document.getElementById('kpi-normal-sub').textContent=pct(normal);
  document.getElementById('kpi-warning').textContent=warning; document.getElementById('kpi-warning-sub').textContent=pct(warning);
  document.getElementById('kpi-critical').textContent=critical; document.getElementById('kpi-critical-sub').textContent=pct(critical);
  document.getElementById('kpi-ssl-expired').textContent=sslExpired; document.getElementById('kpi-ssl-expired-sub').textContent=pct(sslExpired);
  document.getElementById('kpi-ssl-cn').textContent=sslCN; document.getElementById('kpi-ssl-cn-sub').textContent=pct(sslCN);
  document.getElementById('kpi-mismatch').textContent=mismatch; document.getElementById('kpi-mismatch-sub').textContent=pct(mismatch);
}
