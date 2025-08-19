// js/ui/spinner.js
function mkSpinner(host){
  const s = document.createElement('div');
  s.className = 'dm-spinner';
  s.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
  host.style.position = host.style.position || 'relative';
  host.appendChild(s);
  return s;
}
const refs = new Map(); // key -> element
export function spinnerOn(key, hostEl){
  let el = refs.get(key);
  if(!el){ el = mkSpinner(hostEl); refs.set(key, el); }
  el.classList.add('active');
}
export function spinnerOff(key){
  const el = refs.get(key);
  if(el) el.classList.remove('active');
}
