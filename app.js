(function(){
window.addEventListener('error',function(e){var x=document.getElementById('saved');if(x){x.textContent='App error: '+(e.message||'unknown');x.style.color='#b00020';}});

const KEY='orchardPWA_v3_state',OLD='orchardPWA_v2_state',C={planted:'#2f7d37',pending:'#eb9119',purchase:'#cd2d2d',blue:'#357ab8',purple:'#7a4aa0'};
const master=window.MASTER,$=id=>document.getElementById(id);let data,sel=null,layer='current',growth='pruned',view='planner',labels=true,history=[],future=[],nextId=1000,dfN=1,caneN=1,measure=false,measurePts=[];let zoom=1,panX=0,panY=0,pointers=new Map(),lastDist=0,lastMid=null,dragId=null;
const svg=$('yard'),vp=$('viewport'),sh=$('shapes'),pp=$('plants'),ll=$('labelsLayer'),ml=$('measureLayer');const F=['nm','shape','cat','xx','yy','vars','pc','p1','p2','p3','nc','n1','n2','n3','lock','notes'].reduce((o,k)=>(o[k]=$(k),o),{});const clone=x=>JSON.parse(JSON.stringify(x)),keys=['current','y1','y2','y3'];
function migrate(old){if(!Array.isArray(old))return clone(master);return old.map(p=>{let b=master.find(m=>m.name===p.name)||{},pr=p.pruned||p.canopy||b.pruned||{current:3,y1:5,y2:7,y3:9},nat=p.natural||b.natural||Object.fromEntries(keys.map(k=>[k,Math.max(pr[k]||3,(pr[k]||3)*1.4)]));return {...b,...p,shape:p.shape||b.shape||'tree',pruned:pr,natural:nat,varieties:p.varieties||b.varieties||[]}})}
function load(){try{let v=localStorage.getItem(KEY);if(v)data=migrate(JSON.parse(v));else{let o=localStorage.getItem(OLD);data=o?migrate(JSON.parse(o)):clone(master)}}catch(e){data=clone(master)};nextId=Math.max(1000,...data.map(p=>+p.id||0))+1;dfN=data.filter(p=>/^Dragon Fruit Trellis/.test(p.name)).length+1;caneN=data.filter(p=>/^Sugarcane/.test(p.name)).length+1}
function save(){localStorage.setItem(KEY,JSON.stringify(data));$('saved').textContent='Saved ✓'}function snap(){history.push(JSON.stringify(data));if(history.length>50)history.shift();future=[]}function S(t,a={}){let n=document.createElementNS('http://www.w3.org/2000/svg',t);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));return n}function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}function size(p){return +((p[growth]&&p[growth][layer])||3)}
function visualTree(p,col,d){
  let g=S('g'), seed=String(p.name).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  function rnd(i){let x=Math.sin(seed+i*127.17)*43758.5453;return x-Math.floor(x)}
  function polar(a,r){return [p.x+Math.cos(a)*r,p.y+Math.sin(a)*r]}
  function blobPath(scale,bumps,phase){
    let pts=[];
    for(let i=0;i<bumps;i++){
      let a=-Math.PI/2+i*Math.PI*2/bumps;
      let rr=scale*(.84+.16*rnd(i+phase));
      pts.push(polar(a,rr));
    }
    let path="";
    for(let i=0;i<pts.length;i++){
      let prev=pts[(i-1+pts.length)%pts.length],cur=pts[i],next=pts[(i+1)%pts.length];
      let sx=(prev[0]+cur[0])/2, sy=(prev[1]+cur[1])/2;
      let ex=(cur[0]+next[0])/2, ey=(cur[1]+next[1])/2;
      path+=(i===0?`M${sx} ${sy}`:"")+` Q${cur[0]} ${cur[1]} ${ex} ${ey}`;
    }
    return path+" Z";
  }
  function path(dv,fill,stroke,sw,op){g.appendChild(S('path',{d:dv,fill,stroke:stroke||'none','stroke-width':sw||0,opacity:op==null?1:op,'stroke-linejoin':'round'}))}
  function vein(x1,y1,x2,y2,stroke,sw,op){g.appendChild(S('line',{x1,y1,x2,y2,stroke,'stroke-width':sw,opacity:op||1,'stroke-linecap':'round'}))}
  let n=p.name.toLowerCase();

  // Papaya: unmistakable starburst crown from directly overhead.
  if(n.includes('papaya')){
    g.appendChild(S('ellipse',{cx:p.x+.16,cy:p.y+.20,rx:d*.43,ry:d*.40,fill:'#173e24',opacity:'.16'}));
    for(let i=0;i<10;i++){
      let a=-Math.PI/2+i*Math.PI*2/10, L=d*(.35+.035*rnd(i));
      let bx=p.x+Math.cos(a)*L*.36, by=p.y+Math.sin(a)*L*.36;
      vein(p.x,p.y,bx,by,'#5d7d3f',Math.max(.07,d*.014),.95);
      // five-lobed cartoon leaf silhouette
      let tip=polar(a,L*.49), left=polar(a-.22,L*.35), right=polar(a+.22,L*.35);
      let dleaf=`M${bx} ${by} Q${left[0]} ${left[1]} ${tip[0]} ${tip[1]} Q${right[0]} ${right[1]} ${bx} ${by} Z`;
      path(dleaf,i%2?'#4f9749':'#67aa55','#2d7138',.055,.98);
      vein(bx,by,tip[0],tip[1],'#d0d98c',.035,.6);
    }
    g.appendChild(S('circle',{cx:p.x,cy:p.y,r:Math.max(.14,d*.035),fill:'#8c6538',stroke:'#634528','stroke-width':'.04'}));
    for(let i=0;i<4;i++){let a=i*Math.PI/2+.3,q=polar(a,d*.07);g.appendChild(S('ellipse',{cx:q[0],cy:q[1],rx:d*.025,ry:d*.04,fill:'#e1a23a',stroke:'#b06f24','stroke-width':'.025'}))}
    return g;
  }

  // Blueberry: low, compact shrub rather than a tree crown.
  if(n.includes('blueberry')){
    path(blobPath(d*.44,18,10),'#397a43','#235d31',.08,1);
    for(let i=0;i<18;i++){let a=rnd(i+30)*Math.PI*2,r=Math.sqrt(rnd(i+50))*d*.32,q=polar(a,r);
      g.appendChild(S('ellipse',{cx:q[0],cy:q[1],rx:d*.055,ry:d*.035,fill:i%3?'#63a054':'#82b36a',transform:`rotate(${Math.round(a*180/Math.PI)} ${q[0]} ${q[1]})`}));
    }
    for(let i=0;i<10;i++){let a=rnd(i+80)*Math.PI*2,r=Math.sqrt(rnd(i+100))*d*.30,q=polar(a,r);g.appendChild(S('circle',{cx:q[0],cy:q[1],r:Math.max(.045,d*.016),fill:'#3f4f83',stroke:'#28355f','stroke-width':'.025'}))}
    return g;
  }

  let pal=['#3f7f3f','#57924a','#70a65a','#2f6b35'];
  let outline='#23592e',lobes=20;
  if(n.includes('mango')){pal=['#1f5a2d','#2e7135','#448640','#5a9848'];outline='#174723';lobes=24}
  else if(n.includes('atemoya')||n.includes('cherilata')){pal=['#4e8547','#68a057','#80b267','#3b743d'];outline='#315f34';lobes=17}
  else if(n.includes('guava')){pal=['#448246','#61a057','#7bb36b','#34703b'];outline='#285d32';lobes=18}
  else if(n.includes('mamey')){pal=['#245d31','#34733a','#4b8844','#1d4e29'];outline='#153f22';lobes=22}
  else if(n.includes('sapote')){pal=['#306d39','#498448','#659b56','#275f33'];outline='#204e2b';lobes=20}

  // One continuous scalloped crown silhouette — not a collection of circles.
  path(blobPath(d*.49,lobes,5),pal[0],outline,Math.max(.07,d*.012),1);
  // broad painted shadow/highlight masses contained visually inside crown
  for(let i=0;i<7;i++){
    let a=rnd(i+120)*Math.PI*2,r=Math.sqrt(rnd(i+140))*d*.24,q=polar(a,r);
    let rx=d*(.10+.045*rnd(i+160)), ry=rx*(.65+.2*rnd(i+180));
    g.appendChild(S('ellipse',{cx:q[0],cy:q[1],rx,ry,fill:pal[(i%3)+1],opacity:'.72',transform:`rotate(${Math.round(rnd(i+200)*180)} ${q[0]} ${q[1]})`}));
  }
  // hand-drawn leaf strokes for recognizable foliage texture
  for(let i=0;i<20;i++){
    let a=rnd(i+220)*Math.PI*2,r=Math.sqrt(rnd(i+250))*d*.34,q=polar(a,r),ang=rnd(i+280)*Math.PI*2,L=d*(.045+.018*rnd(i+300));
    let x2=q[0]+Math.cos(ang)*L,y2=q[1]+Math.sin(ang)*L;
    vein(q[0],q[1],x2,y2,'#b7cf88',Math.max(.025,d*.004),.45);
  }
  // trunk/branch glimpses at center
  for(let i=0;i<4;i++){let a=i*Math.PI/2+.45+rnd(i+330)*.5,q=polar(a,d*.12);vein(p.x,p.y,q[0],q[1],'#75563a',Math.max(.045,d*.008),.58)}
  g.appendChild(S('circle',{cx:p.x,cy:p.y,r:Math.max(.09,d*.018),fill:'#735238',opacity:'.8'}));

  let fruit=n.includes('mango')?'#f0b13e':n.includes('guava')?'#b9d56b':n.includes('mamey')?'#a86e3c':(n.includes('atemoya')||n.includes('cherilata'))?'#a7c978':null;
  if(fruit)for(let i=0;i<Math.min(8,Math.max(2,Math.round(d/3)));i++){let a=rnd(i+350)*Math.PI*2,r=Math.sqrt(rnd(i+370))*d*.30,q=polar(a,r);g.appendChild(S('ellipse',{cx:q[0],cy:q[1],rx:Math.max(.05,d*.012),ry:Math.max(.065,d*.016),fill:fruit,stroke:'#6d6a37','stroke-width':'.02'}))}
  return g;
}
function drawShape(p){
 let col=C[p.cat]||C.blue,d=size(p);
 if(p.shape==='tree'){
   if(view==='visual')sh.appendChild(visualTree(p,col,d));
   else sh.appendChild(S('circle',{cx:p.x,cy:p.y,r:d/2,fill:col,stroke:col,class:'canopy'}))
 } else if(p.shape==='trellis'){
   let w=d,h=Math.max(1,Math.min(2.5,d*.18));
   if(view==='planner') sh.appendChild(S('rect',{x:p.x-w/2,y:p.y-h/2,width:w,height:h,rx:.25,fill:col,stroke:col,class:'patch'}));
   else {
     // fence/trellis seen from above
     sh.appendChild(S('line',{x1:p.x-w/2,y1:p.y,x2:p.x+w/2,y2:p.y,stroke:'#73746b','stroke-width':'.22'}));
     for(let x=p.x-w/2;x<=p.x+w/2+.01;x+=1){
       sh.appendChild(S('circle',{cx:x,cy:p.y,r:.12,fill:'#777b74'}));
       sh.appendChild(S('ellipse',{cx:x,cy:p.y-.28,rx:.42,ry:.22,fill:'#3f8144',opacity:'.95'}));
       sh.appendChild(S('ellipse',{cx:x+.22,cy:p.y+.18,rx:.45,ry:.23,fill:'#5b9951',opacity:'.92'}));
     }
     if(/^Dragon Fruit/.test(p.name)){
       for(let x=p.x-w/2+.35;x<p.x+w/2;x+=1.1){
         sh.appendChild(S('path',{d:`M${x} ${p.y-.65} Q${x-.25} ${p.y} ${x+.15} ${p.y+.7}`,fill:'none',stroke:'#3f8d54','stroke-width':'.25','stroke-linecap':'round'}));
       }
     }
   }
 } else {
   let w=d,h=Math.max(2,d*.55);
   if(view==='planner') sh.appendChild(S('rect',{x:p.x-w/2,y:p.y-h/2,width:w,height:h,rx:.5,fill:col,stroke:col,class:'patch'}));
   else {
     // dense sugarcane / crop patch from above
     sh.appendChild(S('ellipse',{cx:p.x+.12,cy:p.y+.18,rx:w*.49,ry:h*.48,fill:'#234d2d',opacity:'.18'}));
     for(let i=0;i<Math.max(10,Math.round(w*5));i++){
       let fx=p.x-w*.43+(i%7)/6*w*.86, fy=p.y-h*.38+(Math.floor(i/7)%5)/4*h*.76;
       let a=(i%5-2)*.18, len=h*(.28+(i%3)*.04);
       sh.appendChild(S('path',{d:`M${fx} ${fy} q${Math.sin(a)*len} ${-len*.65} ${Math.sin(a)*len*.5} ${-len}`,fill:'none',stroke:i%2?'#5d9845':'#78aa50','stroke-width':'.13','stroke-linecap':'round'}));
     }
   }
 }
}
function drawLabels(){clear(ll);if(!labels)return;let placed=[];data.forEach((p,i)=>{let lines=[p.name,...(p.varieties||[])].slice(0,5),w=Math.max(...lines.map(s=>s.length))*0.34+1,h=.72*lines.length+.25,cands=[[p.x+.7,p.y-.7],[p.x+.7,p.y+1.1],[p.x-w-.7,p.y-.7],[p.x-w-.7,p.y+1.1],[p.x-w/2,p.y-size(p)/2-1]],pos=cands.find(([x,y])=>!placed.some(b=>x<b.x+b.w&&x+w>b.x&&y<b.y+b.h&&y+h>b.y))||[p.x+.7,p.y-.7+(i%3)*.8],[x,y]=pos;placed.push({x,y,w,h});ll.appendChild(S('line',{x1:p.x,y1:p.y,x2:x,y2:y+.25,class:'leader'}));ll.appendChild(S('rect',{x,y:y-.48,width:w,height:h,rx:.18,class:'lblbox'}));lines.forEach((s,j)=>{let t=S('text',{x:x+.22,y:y+j*.7,class:'lbl'});t.textContent=s;ll.appendChild(t)})})}
function render(){clear(sh);clear(pp);data.forEach(p=>{drawShape(p);let g=S('g',{'data-id':p.id,class:'plant '+(sel===p.id?'sel':'')});g.appendChild(S('circle',{cx:p.x,cy:p.y,r:.52,fill:C[p.cat]||C.blue,class:'marker'}));pp.appendChild(g)});drawLabels();renderList();drawMeasure()}
function renderList(){let l=$('list');clear(l);data.forEach(p=>{let b=document.createElement('button');b.textContent=p.name;b.onclick=()=>select(p.id);l.appendChild(b)})}
function select(id){sel=id;let p=data.find(x=>x.id===id);if(!p)return;$('editor').classList.remove('collapsed');$('head').textContent=p.name+' ▴';Object.values(F).forEach(x=>x.disabled=false);$('dup').disabled=$('del').disabled=false;F.nm.value=p.name;F.shape.value=p.shape;F.cat.value=p.cat;F.xx.value=p.x;F.yy.value=p.y;F.vars.value=(p.varieties||[]).join('\n');F.lock.value=p.locked?'yes':'no';F.notes.value=p.notes||'';[['pc','pruned','current'],['p1','pruned','y1'],['p2','pruned','y2'],['p3','pruned','y3'],['nc','natural','current'],['n1','natural','y1'],['n2','natural','y2'],['n3','natural','y3']].forEach(a=>F[a[0]].value=p[a[1]][a[2]]);render()}
function edit(){let p=data.find(x=>x.id===sel);if(!p)return;snap();p.name=F.nm.value||'Unnamed';p.shape=F.shape.value;p.cat=F.cat.value;p.x=Math.max(0,Math.min(56,+F.xx.value||0));p.y=Math.max(0,Math.min(42,+F.yy.value||0));p.varieties=F.vars.value.split('\n').map(x=>x.trim()).filter(Boolean);p.locked=F.lock.value==='yes';p.notes=F.notes.value;[['pc','pruned','current'],['p1','pruned','y1'],['p2','pruned','y2'],['p3','pruned','y3'],['nc','natural','current'],['n1','natural','y1'],['n2','natural','y2'],['n3','natural','y3']].forEach(a=>p[a[1]][a[2]]=Math.max(.5,+F[a[0]].value||1));save();render()}
Object.values(F).forEach(x=>x.addEventListener('change',edit));$('head').onclick=()=>$('editor').classList.toggle('collapsed');document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{layer=b.dataset.layer;document.querySelectorAll('[data-layer]').forEach(x=>x.classList.toggle('on',x===b));render()});document.querySelectorAll('[data-growth]').forEach(b=>b.onclick=()=>{growth=b.dataset.growth;document.querySelectorAll('[data-growth]').forEach(x=>x.classList.toggle('on',x===b));render()});document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('on',x===b));render()});$('labels').onclick=function(){labels=!labels;this.classList.toggle('on',labels);render()};
function add(p){snap();p.id=nextId++;p.locked=false;p.notes=p.notes||'';p.varieties=p.varieties||[];data.push(p);save();select(p.id)}$('add').onclick=()=>add({name:'New Tree',x:28,y:21,cat:'pending',shape:'tree',pruned:{current:3,y1:5,y2:7,y3:9},natural:{current:3,y1:6,y2:10,y3:14}});$('df').onclick=()=>{if(dfN>5){$('saved').textContent='5 DF trellises already added';return}add({name:'Dragon Fruit Trellis '+dfN++,x:5,y:10,cat:'blue',shape:'trellis',pruned:{current:4,y1:5,y2:5,y3:5},natural:{current:4,y1:6,y2:7,y3:8},varieties:[]})};$('cane').onclick=()=>add({name:'Sugarcane Patch '+caneN++,x:8,y:16,cat:'planted',shape:'patch',pruned:{current:3,y1:4,y2:4,y3:4},natural:{current:3,y1:5,y2:6,y3:7},varieties:[]});$('dup').onclick=()=>{let p=data.find(x=>x.id===sel);if(p){let q=clone(p);q.name+=' Copy';q.x=Math.min(56,q.x+1);q.y=Math.min(42,q.y+1);add(q)}};$('del').onclick=()=>{if(sel==null)return;snap();data=data.filter(x=>x.id!==sel);sel=null;save();render();$('editor').classList.add('collapsed')};$('reset').onclick=()=>{if(confirm('Reset to master layout? User-added trellises and sugarcane will be removed.')){snap();data=clone(master);save();render()}};$('undo').onclick=()=>{if(history.length){future.push(JSON.stringify(data));data=JSON.parse(history.pop());save();render()}};$('redo').onclick=()=>{if(future.length){history.push(JSON.stringify(data));data=JSON.parse(future.pop());save();render()}};$('export').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='backyard-orchard-v3-backup.json';a.click()};$('import').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{snap();data=migrate(JSON.parse(r.result));save();render();$('saved').textContent='Backup restored ✓'}catch(x){alert('That backup could not be read.')}};r.readAsText(f)};
function transform(){svg.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;$('fit').textContent=Math.round(zoom*100)+'%'}function setZoom(z,cx=vp.clientWidth/2,cy=vp.clientHeight/2){let nz=Math.max(1,Math.min(5,z)),r=nz/zoom;panX=cx-(cx-panX)*r;panY=cy-(cy-panY)*r;zoom=nz;if(zoom===1)panX=panY=0;transform()}$('plus').onclick=()=>setZoom(zoom*1.25);$('minus').onclick=()=>setZoom(zoom/1.25);$('fit').onclick=()=>{zoom=1;panX=panY=0;transform()};function mapPoint(e){let r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal;return{x:v.x+(e.clientX-r.left)*v.width/r.width,y:v.y+(e.clientY-r.top)*v.height/r.height}}
$('measure').onclick=function(){measure=!measure;measurePts=[];this.classList.toggle('on',measure);drawMeasure()};function drawMeasure(){clear(ml);if(measurePts.length){let a=measurePts[0];ml.appendChild(S('circle',{cx:a.x,cy:a.y,r:.3,fill:'#111'}));if(measurePts.length===2){let b=measurePts[1],d=Math.hypot(a.x-b.x,a.y-b.y);ml.appendChild(S('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#111','stroke-width':'.15'}));let t=S('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-.4,class:'lbl'});t.textContent=d.toFixed(1)+' ft';ml.appendChild(t)}}}
vp.addEventListener('pointerdown',e=>{vp.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(measure&&pointers.size===1&&!(e.target.closest?e.target.closest('.plant'):null)){let q=mapPoint(e);if(measurePts.length===2)measurePts=[];measurePts.push(q);drawMeasure();return}let t=(e.target.closest?e.target.closest('.plant'):null);if(t&&pointers.size===1){let id=+t.dataset.id,p=data.find(x=>x.id===id);select(id);if(!p.locked){snap();dragId=id}}if(pointers.size===2){dragId=null;let a=[...pointers.values()];lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);lastMid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}}});vp.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){e.preventDefault();let a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),m={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2},r=vp.getBoundingClientRect();setZoom(zoom*d/lastDist,m.x-r.left,m.y-r.top);panX+=m.x-lastMid.x;panY+=m.y-lastMid.y;lastDist=d;lastMid=m;transform()}else if(dragId!=null){e.preventDefault();let q=mapPoint(e),p=data.find(x=>x.id===dragId);p.x=Math.max(0,Math.min(56,Math.round(q.x*2)/2));p.y=Math.max(0,Math.min(42,Math.round(q.y*2)/2));render()}});function end(e){pointers.delete(e.pointerId);if(dragId!=null&&pointers.size===0){let id=dragId;dragId=null;save();select(id)}lastDist=0;lastMid=null}vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);
load();save();render();transform();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();