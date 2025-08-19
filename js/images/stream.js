export function renderShotsStream(container, images){
  const arr=images.all||[]; const total=arr.length;
  container.innerHTML=''; const CHUNK=20; let idx=0, num=1;

  function appendChunk(){
    const frag=document.createDocumentFragment();
    for(let i=0;i<CHUNK && idx<arr.length;i++,idx++,num++){
      const r=arr[idx];
      const card=document.createElement('div');
      card.className='shot-card';
      card.setAttribute('data-host', r.host);
      card.id='shot-'+r.host+'-'+r.ts;
      card.innerHTML=
        '<div class="shot-meta">['+num+'/'+total+'] '+r.host+' · '+r.ts+' · '+r.status+(r.label?' · '+r.label:'')+'</div>'
        +'<a href="'+r.url+'" target="_blank" rel="noopener"><img loading="lazy" src="'+r.url+'" alt="'+r.host+' screenshot"></a>'
        +'<div class="shot-filename">'+r.filename+'</div>';
      frag.appendChild(card);
    }
    container.appendChild(frag);
  }

  appendChunk();
  const sentinel=document.createElement('div'); sentinel.style.height='1px'; container.appendChild(sentinel);
  const io=new IntersectionObserver((entries)=>{
    if(entries.some(en=>en.isIntersecting)){
      io.unobserve(sentinel);
      appendChunk();
      container.appendChild(sentinel);
      io.observe(sentinel);
    }
  },{root:null,threshold:0.1});
  io.observe(sentinel);

  document.getElementById('btnHome').classList.add('active');
}
