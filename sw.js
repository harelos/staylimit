const C='ov-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./billing.js','./manifest.json'])));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(res=>{const cl=res.clone();if(res.ok&&new URL(e.request.url).origin===location.origin)caches.open(C).then(c=>c.put(e.request,cl));return res}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
