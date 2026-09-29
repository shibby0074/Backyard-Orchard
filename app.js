(function(){
window.addEventListener('error',function(e){var x=document.getElementById('saved');if(x){x.textContent='App error: '+(e.message||'unknown');x.style.color='#b00020';}});

const KEY='orchardPWA_v34_state',OLD='orchardPWA_v3_state',C={planted:'#2f7d37',pending:'#eb9119',purchase:'#cd2d2d',blue:'#357ab8',purple:'#7a4aa0'};
const master=window.MASTER,$=id=>document.getElementById(id);let data,sel=null,layer='current',growth='pruned',view='planner',labels=true,history=[],future=[],nextId=1000,dfN=1,caneN=1,measure=false,measurePts=[];let zoom=1,panX=0,panY=0,pointers=new Map(),lastDist=0,lastMid=null,dragId=null;
const svg=$('yard'),vp=$('viewport'),sh=$('shapes'),pp=$('plants'),ll=$('labelsLayer'),ml=$('measureLayer');const F=['nm','shape','cat','xx','yy','vars','pc','p1','p2','p3','nc','n1','n2','n3','lock','notes'].reduce((o,k)=>(o[k]=$(k),o),{});const clone=x=>JSON.parse(JSON.stringify(x)),keys=['current','y1','y2','y3'];
function migrate(old){if(!Array.isArray(old))return clone(master);return old.map(p=>{let b=master.find(m=>m.name===p.name)||{},pr=p.pruned||p.canopy||b.pruned||{current:3,y1:5,y2:7,y3:9},nat=p.natural||b.natural||Object.fromEntries(keys.map(k=>[k,Math.max(pr[k]||3,(pr[k]||3)*1.4)]));return {...b,...p,shape:p.shape||b.shape||'tree',pruned:pr,natural:nat,varieties:p.varieties||b.varieties||[]}})}
function load(){try{let v=localStorage.getItem(KEY);if(v)data=migrate(JSON.parse(v));else{let o=localStorage.getItem(OLD);data=o?migrate(JSON.parse(o)):clone(master)}}catch(e){data=clone(master)};nextId=Math.max(1000,...data.map(p=>+p.id||0))+1;dfN=data.filter(p=>/^Dragon Fruit Trellis/.test(p.name)).length+1;caneN=data.filter(p=>/^Sugarcane/.test(p.name)).length+1}
function save(){localStorage.setItem(KEY,JSON.stringify(data));$('saved').textContent='Saved ✓'}function snap(){history.push(JSON.stringify(data));if(history.length>50)history.shift();future=[]}function S(t,a={}){let n=document.createElementNS('http://www.w3.org/2000/svg',t);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));return n}function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}function size(p){return +((p[growth]&&p[growth][layer])||3)}
function visualTree(p,col,d){
 let g=S('g'),seed=[...p.name].reduce((a,c)=>a+c.charCodeAt(0),0);
 function rnd(i){let x=Math.sin(seed+i*73.17)*9182.37;return x-Math.floor(x)}
 function q(a,r){return[p.x+Math.cos(a)*r,p.y+Math.sin(a)*r]}
 function crown(rad,bumps,phase){
   let pts=[]; for(let i=0;i<bumps;i++){let a=-Math.PI/2+i*2*Math.PI/bumps,rr=rad*(.86+.14*rnd(i+phase));pts.push(q(a,rr))}
   let d0="";for(let i=0;i<bumps;i++){let a=pts[(i-1+bumps)%bumps],b=pts[i],c=pts[(i+1)%bumps];
     let sx=(a[0]+b[0])/2,sy=(a[1]+b[1])/2,ex=(b[0]+c[0])/2,ey=(b[1]+c[1])/2;
     if(i===0)d0+=`M${sx} ${sy}`; d0+=` Q${b[0]} ${b[1]} ${ex} ${ey}`}
   return d0+" Z"
 }
 function add(tag,a){let z=S(tag,a);g.appendChild(z);return z}
 let n=p.name.toLowerCase();
 if(n.includes('papaya')){
   for(let i=0;i<11;i++){let a=i*2*Math.PI/11-Math.PI/2,tip=q(a,d*.48),l=q(a-.24,d*.27),r=q(a+.24,d*.27);
     add('path',{d:`M${p.x} ${p.y} Q${l[0]} ${l[1]} ${tip[0]} ${tip[1]} Q${r[0]} ${r[1]} ${p.x} ${p.y}Z`,fill:i%2?'#62a84e':'#4b9342',stroke:'#245d32','stroke-width':'.075','stroke-linejoin':'round'})}
   add('circle',{cx:p.x,cy:p.y,r:Math.max(.12,d*.03),fill:'#a56f38',stroke:'#694321','stroke-width':'.05'});return g
 }
 if(n.includes('blueberry')){
   add('path',{d:crown(d*.48,18,20),fill:'#4f934b',stroke:'#245f32','stroke-width':'.09'});
   for(let i=0;i<14;i++){let a=rnd(i+40)*Math.PI*2,r=Math.sqrt(rnd(i+60))*d*.34,z=q(a,r);
     add('ellipse',{cx:z[0],cy:z[1],rx:d*.06,ry:d*.035,fill:i%2?'#79b466':'#65a455',stroke:'#3f7e42','stroke-width':'.02'})}
   for(let i=0;i<8;i++){let a=rnd(i+90)*Math.PI*2,r=Math.sqrt(rnd(i+110))*d*.28,z=q(a,r);add('circle',{cx:z[0],cy:z[1],r:Math.max(.045,d*.014),fill:'#45558d',stroke:'#263665','stroke-width':'.025'})}
   return g
 }
 let fill='#4f9848',edge='#245f31',inner='#72ad5b';
 if(n.includes('mango')){fill='#347f3b';edge='#174e29';inner='#55a04a'}
 else if(n.includes('atemoya')||n.includes('cherilata')){fill='#67a456';edge='#356e39';inner='#8abd6c'}
 else if(n.includes('guava')){fill='#5a9f50';edge='#2d6938';inner='#7db76a'}
 else if(n.includes('mamey')){fill='#34783a';edge='#1c5129';inner='#579447'}
 else if(n.includes('sapote')){fill='#478a44';edge='#245d32';inner='#69a456'}
 add('path',{d:crown(d*.49,n.includes('mango')?26:20,5),fill,stroke:edge,'stroke-width':Math.max(.08,d*.012),'stroke-linejoin':'round'});
 // flat cartoon foliage tufts, deliberately no transparency/shadows
 for(let i=0;i<9;i++){let a=rnd(i+130)*Math.PI*2,r=Math.sqrt(rnd(i+150))*d*.28,z=q(a,r),rr=d*(.055+.025*rnd(i+170));
   add('circle',{cx:z[0],cy:z[1],r:rr,fill:inner,stroke:edge,'stroke-width':'.025'})}
 // leaf marks
 for(let i=0;i<12;i++){let a=rnd(i+190)*Math.PI*2,r=Math.sqrt(rnd(i+210))*d*.32,z=q(a,r),ang=rnd(i+230)*Math.PI;
   add('ellipse',{cx:z[0],cy:z[1],rx:d*.028,ry:d*.012,fill:'#a9cf78',transform:`rotate(${ang*180/Math.PI} ${z[0]} ${z[1]})`})}
 return g
}
function drawShape(p){
 let col=C[p.cat]||C.blue,d=size(p),n=(p.name||'').toLowerCase(),rot=Number(p.angle)||0;
 let isDF=n.includes('dragon fruit') || n.includes('df trellis') || (p.shape==='trellis' && p.x<=10 && p.y<=15);
 let target=sh;
 if((p.shape==='trellis'||p.shape==='patch')&&!isDF&&rot){let rg=S('g',{transform:`rotate(${rot} ${p.x} ${p.y})`});sh.appendChild(rg);target=rg}
 if(p.shape==='tree'){
   if(view==='visual')target.appendChild(visualTree(p,col,d));
   else target.appendChild(S('circle',{cx:p.x,cy:p.y,r:d/2,fill:col,stroke:col,class:'canopy'}))
 }else if(p.shape==='trellis'){
   let w=d,h=Math.max(1,Math.min(2.5,d*.18));
   if(view==='planner'){
     if(isDF) target.appendChild(S('circle',{cx:p.x,cy:p.y,r:d/2,fill:col,stroke:col,class:'canopy'}));
     else target.appendChild(S('rect',{x:p.x-w/2,y:p.y-h/2,width:w,height:h,rx:.25,fill:col,stroke:col,class:'patch'}))
   }
   else if(isDF){
     let g=S('g');
     // umbrella-style dragon fruit canopy: circular footprint around the central trellis
     g.appendChild(S('circle',{cx:p.x,cy:p.y,r:d*.46,fill:'#4f9d4d',stroke:'#276c37','stroke-width':'.09'}));
     g.appendChild(S('circle',{cx:p.x,cy:p.y,r:Math.max(.15,d*.045),fill:'#8d6b48',stroke:'#5d422d','stroke-width':'.06'}));
     for(let i=0;i<10;i++){let a=i*2*Math.PI/10,rr=d*(.34+(i%3)*.035),x2=p.x+Math.cos(a)*rr,y2=p.y+Math.sin(a)*rr;
       let bend=a+(i%2?.22:-.22),mx=p.x+Math.cos(bend)*rr*.55,my=p.y+Math.sin(bend)*rr*.55;
       g.appendChild(S('path',{d:`M${p.x} ${p.y} Q${mx} ${my} ${x2} ${y2}`,fill:'none',stroke:i%2?'#55a851':'#3d9347','stroke-width':Math.max(.18,d*.055),'stroke-linecap':'round','stroke-linejoin':'round'}));
       g.appendChild(S('circle',{cx:x2,cy:y2,r:Math.max(.07,d*.022),fill:'#ee5b92',stroke:'#a93267','stroke-width':'.035'}))
     }target.appendChild(g)
   }else{
     // passion-fruit fence/trellis, flat top-down
     let g=S('g');
     g.appendChild(S('rect',{x:p.x-w/2,y:p.y-.13,width:w,height:.26,fill:'#8a755d',stroke:'#594b3d','stroke-width':'.05'}));
     for(let i=0;i<Math.max(8,Math.round(w*2));i++){let x=p.x-w*.45+(i/(Math.max(7,Math.round(w*2)-1)))*w*.9,yy=p.y+(i%2?-.22:.22);
       g.appendChild(S('ellipse',{cx:x,cy:yy,rx:.32,ry:.18,fill:i%3?'#4c9948':'#69ad58',stroke:'#2e7139','stroke-width':'.04',transform:`rotate(${i%2?25:-25} ${x} ${yy})`}));
       if(i%4===0)g.appendChild(S('circle',{cx:x+.08,cy:yy,r:.065,fill:'#8a58a4',stroke:'#5c3974','stroke-width':'.025'}))
     }target.appendChild(g)
   }
 }else{
   let w=d,h=Math.max(2,d*.55);
   if(view==='planner')target.appendChild(S('rect',{x:p.x-w/2,y:p.y-h/2,width:w,height:h,rx:.5,fill:col,stroke:col,class:'patch'}));
   else{let g=S('g');for(let i=0;i<Math.max(12,Math.round(w*5));i++){let x=p.x-w*.42+(i%7)/6*w*.84,y=p.y-h*.34+(Math.floor(i/7)%4)/3*h*.68;
     g.appendChild(S('path',{d:`M${x} ${y+.25} Q${x-.12} ${y} ${x+.03} ${y-.42}`,fill:'none',stroke:i%2?'#67a94e':'#478f43','stroke-width':'.13','stroke-linecap':'round'}))}target.appendChild(g)}
 }
}
function drawLabels(){clear(ll);if(!labels)return;let placed=[];data.forEach((p,i)=>{let lines=[p.name,...(p.varieties||[])].slice(0,5),w=Math.max(...lines.map(s=>s.length))*0.34+1,h=.72*lines.length+.25,cands=[[p.x+.7,p.y-.7],[p.x+.7,p.y+1.1],[p.x-w-.7,p.y-.7],[p.x-w-.7,p.y+1.1],[p.x-w/2,p.y-size(p)/2-1]],pos=cands.find(([x,y])=>!placed.some(b=>x<b.x+b.w&&x+w>b.x&&y<b.y+b.h&&y+h>b.y))||[p.x+.7,p.y-.7+(i%3)*.8],[x,y]=pos;placed.push({x,y,w,h});ll.appendChild(S('line',{x1:p.x,y1:p.y,x2:x,y2:y+.25,class:'leader'}));ll.appendChild(S('rect',{x,y:y-.48,width:w,height:h,rx:.18,class:'lblbox'}));lines.forEach((s,j)=>{let t=S('text',{x:x+.22,y:y+j*.7,class:'lbl'});t.textContent=s;ll.appendChild(t)})})}
function render(){clear(sh);clear(pp);data.forEach(p=>{drawShape(p);let g=S('g',{'data-id':p.id,class:'plant '+(sel===p.id?'sel':'')});g.appendChild(S('circle',{cx:p.x,cy:p.y,r:.52,fill:C[p.cat]||C.blue,class:'marker'}));pp.appendChild(g)});drawLabels();renderList();drawMeasure()}
function renderList(){let l=$('list');clear(l);data.forEach(p=>{let b=document.createElement('button');b.textContent=p.name;b.onclick=()=>select(p.id);l.appendChild(b)})}
function select(id){sel=id;let p=data.find(x=>x.id===id);if(!p)return;$('editor').classList.remove('collapsed');$('head').textContent=p.name+' ▴';Object.values(F).forEach(x=>x.disabled=false);$('dup').disabled=$('del').disabled=$('viewPhotos').disabled=false;$('takePhoto').classList.remove('disabled');F.nm.value=p.name;F.shape.value=p.shape;F.cat.value=p.cat;F.xx.value=p.x;F.yy.value=p.y;F.vars.value=(p.varieties||[]).join('\n');F.lock.value=p.locked?'yes':'no';F.notes.value=p.notes||'';[['pc','pruned','current'],['p1','pruned','y1'],['p2','pruned','y2'],['p3','pruned','y3'],['nc','natural','current'],['n1','natural','y1'],['n2','natural','y2'],['n3','natural','y3']].forEach(a=>F[a[0]].value=p[a[1]][a[2]]);render()}
function edit(){let p=data.find(x=>x.id===sel);if(!p)return;snap();p.name=F.nm.value||'Unnamed';p.shape=F.shape.value;p.cat=F.cat.value;p.x=Math.max(0,Math.min(56,+F.xx.value||0));p.y=Math.max(0,Math.min(42,+F.yy.value||0));p.varieties=F.vars.value.split('\n').map(x=>x.trim()).filter(Boolean);p.locked=F.lock.value==='yes';p.notes=F.notes.value;[['pc','pruned','current'],['p1','pruned','y1'],['p2','pruned','y2'],['p3','pruned','y3'],['nc','natural','current'],['n1','natural','y1'],['n2','natural','y2'],['n3','natural','y3']].forEach(a=>p[a[1]][a[2]]=Math.max(.5,+F[a[0]].value||1));save();render()}
Object.values(F).forEach(x=>x.addEventListener('change',edit));$('head').onclick=()=>$('editor').classList.toggle('collapsed');document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{layer=b.dataset.layer;document.querySelectorAll('[data-layer]').forEach(x=>x.classList.toggle('on',x===b));render()});document.querySelectorAll('[data-growth]').forEach(b=>b.onclick=()=>{growth=b.dataset.growth;document.querySelectorAll('[data-growth]').forEach(x=>x.classList.toggle('on',x===b));render()});document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('on',x===b));render()});$('labels').onclick=function(){labels=!labels;this.classList.toggle('on',labels);render()};
function add(p){snap();p.id=nextId++;p.locked=false;p.notes=p.notes||'';p.varieties=p.varieties||[];data.push(p);save();select(p.id)}$('add').onclick=()=>add({name:'New Tree',x:28,y:21,cat:'pending',shape:'tree',pruned:{current:3,y1:5,y2:7,y3:9},natural:{current:3,y1:6,y2:10,y3:14}});$('df').onclick=()=>{if(dfN>5){$('saved').textContent='5 DF trellises already added';return}add({name:'Dragon Fruit Trellis '+dfN++,x:5,y:10,cat:'blue',shape:'trellis',pruned:{current:4,y1:5,y2:5,y3:5},natural:{current:4,y1:6,y2:7,y3:8},varieties:[]})};$('cane').onclick=()=>add({name:'Sugarcane Patch '+caneN++,x:8,y:16,cat:'planted',shape:'patch',pruned:{current:3,y1:4,y2:4,y3:4},natural:{current:3,y1:5,y2:6,y3:7},varieties:[]});$('dup').onclick=()=>{let p=data.find(x=>x.id===sel);if(p){let q=clone(p);q.name+=' Copy';q.x=Math.min(56,q.x+1);q.y=Math.min(42,q.y+1);add(q)}};$('del').onclick=()=>{if(sel==null)return;snap();data=data.filter(x=>x.id!==sel);sel=null;save();render();$('editor').classList.add('collapsed')};$('reset').onclick=()=>{if(confirm('Reset to master layout? User-added trellises and sugarcane will be removed.')){snap();data=clone(master);save();render()}};$('undo').onclick=()=>{if(history.length){future.push(JSON.stringify(data));data=JSON.parse(history.pop());save();render()}};$('redo').onclick=()=>{if(future.length){history.push(JSON.stringify(data));data=JSON.parse(future.pop());save();render()}};$('export').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='backyard-orchard-v3-backup.json';a.click()};$('import').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{snap();data=migrate(JSON.parse(r.result));save();render();$('saved').textContent='Backup restored ✓'}catch(x){alert('That backup could not be read.')}};r.readAsText(f)};
function transform(){svg.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;$('fit').textContent=Math.round(zoom*100)+'%'}function setZoom(z,cx=vp.clientWidth/2,cy=vp.clientHeight/2){let nz=Math.max(1,Math.min(5,z)),r=nz/zoom;panX=cx-(cx-panX)*r;panY=cy-(cy-panY)*r;zoom=nz;if(zoom===1)panX=panY=0;transform()}$('plus').onclick=()=>setZoom(zoom*1.25);$('minus').onclick=()=>setZoom(zoom/1.25);$('fit').onclick=()=>{zoom=1;panX=panY=0;transform()};function mapPoint(e){let r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal;return{x:v.x+(e.clientX-r.left)*v.width/r.width,y:v.y+(e.clientY-r.top)*v.height/r.height}}
$('measure').onclick=function(){measure=!measure;measurePts=[];this.classList.toggle('on',measure);drawMeasure()};function drawMeasure(){clear(ml);if(measurePts.length){let a=measurePts[0];ml.appendChild(S('circle',{cx:a.x,cy:a.y,r:.3,fill:'#111'}));if(measurePts.length===2){let b=measurePts[1],d=Math.hypot(a.x-b.x,a.y-b.y);ml.appendChild(S('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#111','stroke-width':'.15'}));let t=S('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-.4,class:'lbl'});t.textContent=d.toFixed(1)+' ft';ml.appendChild(t)}}}
vp.addEventListener('pointerdown',e=>{vp.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(measure&&pointers.size===1&&!(e.target.closest?e.target.closest('.plant'):null)){let q=mapPoint(e);if(measurePts.length===2)measurePts=[];measurePts.push(q);drawMeasure();return}let t=(e.target.closest?e.target.closest('.plant'):null);if(t&&pointers.size===1){let id=+t.dataset.id,p=data.find(x=>x.id===id);select(id);if(!p.locked){snap();dragId=id}}if(pointers.size===2){dragId=null;let a=[...pointers.values()];lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);lastMid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}}});vp.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){e.preventDefault();let a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),m={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2},r=vp.getBoundingClientRect();setZoom(zoom*d/lastDist,m.x-r.left,m.y-r.top);panX+=m.x-lastMid.x;panY+=m.y-lastMid.y;lastDist=d;lastMid=m;transform()}else if(dragId!=null){e.preventDefault();let q=mapPoint(e),p=data.find(x=>x.id===dragId);p.x=Math.max(0,Math.min(56,Math.round(q.x*2)/2));p.y=Math.max(0,Math.min(42,Math.round(q.y*2)/2));render()}});function end(e){pointers.delete(e.pointerId);if(dragId!=null&&pointers.size===0){let id=dragId;dragId=null;save();select(id)}lastDist=0;lastMid=null}vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);

// Per-plant photo history. Images are stored in IndexedDB on this browser/device.
const PHOTO_DB='orchardPhotos_v1', PHOTO_STORE='photos'; let photoPlantId=null,photoUrls=[];
function pdb(){return new Promise((ok,no)=>{let r=indexedDB.open(PHOTO_DB,1);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains(PHOTO_STORE)){let st=d.createObjectStore(PHOTO_STORE,{keyPath:'id',autoIncrement:true});st.createIndex('plantId','plantId')}};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function photoAdd(pid,file){let d=await pdb();await new Promise((ok,no)=>{let t=d.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).add({plantId:String(pid),taken:new Date().toISOString(),blob:file});t.oncomplete=ok;t.onerror=()=>no(t.error)});d.close()}
async function photoGet(pid){let d=await pdb(),rows=await new Promise((ok,no)=>{let r=d.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).index('plantId').getAll(String(pid));r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)});d.close();return rows.sort((a,b)=>b.taken.localeCompare(a.taken))}
async function photoDelete(id){let d=await pdb();await new Promise((ok,no)=>{let t=d.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)});d.close()}
function camera(){if(sel==null)return;photoPlantId=sel;$('cameraInput').click()}
async function gallery(){if(sel==null)return;photoPlantId=sel;let p=data.find(x=>x.id===sel);$('photoTitle').textContent=(p?p.name:'Plant')+' — Progress';$('photoModal').classList.add('open');await galleryRender()}
async function galleryRender(){photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];let rows=await photoGet(photoPlantId),g=$('photoGrid');g.innerHTML='';$('viewPhotos').textContent='🖼 Photos ('+rows.length+')';if(!rows.length){g.innerHTML='<div style="padding:25px;color:#68766b">No photos yet. Tap Take Photo to start.</div>';return}rows.forEach(r=>{let u=URL.createObjectURL(r.blob);photoUrls.push(u);let d=new Date(r.taken),c=document.createElement('div');c.className='photoCard';c.innerHTML='<img alt="Tree progress photo"><div class="photoMeta"><b>'+d.toLocaleDateString()+'</b><br>'+d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})+'</div><button data-pdel="'+r.id+'">Delete</button>';c.querySelector('img').src=u;g.appendChild(c)})}
$('viewPhotos').onclick=gallery;$('closePhotos').onclick=()=>{$('photoModal').classList.remove('open')};$('photoModal').onclick=e=>{if(e.target===$('photoModal'))$('photoModal').classList.remove('open')};
$('cameraInput').onchange=async e=>{let f=e.target.files&&e.target.files[0];if(!f||photoPlantId==null)return;await photoAdd(photoPlantId,f);e.target.value='';if($('photoModal').classList.contains('open'))await galleryRender();else{$('saved').textContent='Photo saved ✓';let rows=await photoGet(photoPlantId);$('viewPhotos').textContent='🖼 Photos ('+rows.length+')'}};
$('photoGrid').onclick=async e=>{let id=e.target.dataset&&e.target.dataset.pdel;if(id&&confirm('Delete this photo?')){await photoDelete(+id);await galleryRender()}};

load();save();render();transform();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();