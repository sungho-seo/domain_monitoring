// js/ui/notify.js
let wrap;
function ensureWrap(){
  if(!wrap){
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
}
export function toast(msg, type='info', ttl=3000){
  ensureWrap();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  if(ttl>0){
    setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(), 200); }, ttl);
  }
}
