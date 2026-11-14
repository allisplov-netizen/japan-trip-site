// Offline copy of the encrypted page. Only public files are cached; API calls are never intercepted.
const CACHE='trip-pages-v1';
const SHELL=['./','./index.html','./favicon.svg'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const store=(request,response)=>{if(response&&(response.ok||response.type==='opaque')){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;};
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin===self.location.origin){
  if(url.pathname.includes('/api/'))return;
  event.respondWith(fetch(request).then(response=>store(request,response)).catch(()=>caches.match(request,{ignoreSearch:true}).then(hit=>hit||caches.match('./index.html'))));
  return;
 }
 if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>store(request,response))));
 }
});
