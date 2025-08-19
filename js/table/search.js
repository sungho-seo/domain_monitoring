import { state } from '../state.js';
import { applyFilter } from './filters.js';

export function bindSearch(){
  const input=document.getElementById('search');
  if(!input) return;
  // placeholder 폭에 맞춰 width
  fitSearchWidth(input);
  window.addEventListener('resize', ()=>fitSearchWidth(input));
  input.addEventListener('input',(e)=>{ state.searchQuery=e.target.value||''; applyFilter(); });
}

function fitSearchWidth(input){
  const ph=input.getAttribute('placeholder')||'';
  const c=document.createElement('canvas').getContext('2d');
  const st=getComputedStyle(input);
  c.font=`${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
  const w=c.measureText(ph).width;
  const pad=(parseFloat(st.paddingLeft)||0)+(parseFloat(st.paddingRight)||0)+18;
  input.style.width=Math.ceil(w+pad)+'px';
}
