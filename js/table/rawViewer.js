export function openRawView(raw,idx,url,tr){
  const sel=document.querySelector('tr.row-selected'); if(sel) sel.classList.remove('row-selected');
  if(tr) tr.classList.add('row-selected');
  document.getElementById('rawTitle').textContent='원본 행 #'+(idx+1)+' — '+(url?url.replace(/^https?:\/\//,''):'');
  document.getElementById('rawKV').innerHTML=renderRawKV(raw);
  document.getElementById('rawJSON').textContent=JSON.stringify(raw,null,2);
  document.getElementById('rawViewer').setAttribute('data-open','1');
  requestAnimationFrame(()=>document.getElementById('rawViewer').scrollIntoView({behavior:'smooth',block:'start'}));
}
export function closeRawView(){
  document.getElementById('rawViewer').removeAttribute('data-open');
  document.getElementById('rawKV').innerHTML='';
  document.getElementById('rawJSON').textContent='{}';
  const sel=document.querySelector('tr.row-selected'); if(sel) sel.classList.remove('row-selected');
}
function renderRawKV(obj){
  if(!obj||typeof obj!=='object') return '<em>원본 데이터 없음</em>';
  const keys=Object.keys(obj); if(keys.length===0) return '<em>원본 데이터 없음</em>';
  const escapeHTML=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
  return '<table class="kv"><tbody>'+keys.map(k=>'<tr><th>'+escapeHTML(k)+'</th><td>'+escapeHTML(String(obj[k]??'')).replace(/\n/g,'<br/>')+'</td></tr>').join('')+'</tbody></table>';
}
