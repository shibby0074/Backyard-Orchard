const C='orchard-v4-0-mobile-fix-20260928';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'reload'}).catch(()=>caches.match('./index.html')));return;}
 e.respondWith(fetch(e.request,{cache:'reload'}).then(r=>{let q=r.clone();caches.open(C).then(c=>c.put(e.request,q));return r}).catch(()=>caches.match(e.request)));
});