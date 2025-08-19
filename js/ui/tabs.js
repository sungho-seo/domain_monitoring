export function setupTabs({ onEnterShots }){
  document.addEventListener('click', (e)=>{
    const tbtn=e.target.closest('.tab-btn');
    if(!tbtn) return;
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    tbtn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    const id=tbtn.dataset.tab;
    document.getElementById(id).classList.add('active');

    const searchBox=document.querySelector('.search');
    if(id==='tab-shots'){ if(searchBox) searchBox.style.display='none'; onEnterShots && onEnterShots(); }
    else { if(searchBox) searchBox.style.display=''; document.getElementById('btnHome').classList.remove('active'); }
  });
}
