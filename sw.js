// Offline copy of the encrypted page and of map tiles already viewed. API calls are never intercepted.
const CACHE='trip-pages-v2';
const TILES='trip-tiles-v1';
const TILE_LIMIT=4000;
const SHELL=['./','./index.html','./favicon.svg'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const store=(name,request,response)=>{if(response&&(response.ok||(response.type==='opaque'&&name!==TILES))){const copy=response.clone();caches.open(name).then(cache=>cache.put(request,copy));}return response;};
// A slow mobile network falls back to the saved copy instead of waiting indefinitely.
const withTimeout=(promise,ms)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('timeout')),ms);promise.then(value=>{clearTimeout(timer);resolve(value);},reason=>{clearTimeout(timer);reject(reason);});});
let trimming=false;
async function trimTiles(){
 if(trimming)return;trimming=true;
 try{const cache=await caches.open(TILES);const keys=await cache.keys();for(let i=0;i<keys.length-TILE_LIMIT;i++)await cache.delete(keys[i]);}finally{trimming=false;}
}
const cacheFirst=(name,request,after)=>caches.open(name).then(cache=>cache.match(request).then(hit=>hit||fetch(request).then(response=>{store(name,request,response);if(after)after();return response;})));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin===self.location.origin){
  if(url.pathname.includes('/api/'))return;
  const network=fetch(request).then(response=>store(CACHE,request,response));
  event.respondWith(withTimeout(network,6000).catch(()=>caches.match(request,{ignoreSearch:true,cacheName:CACHE}).then(hit=>hit||caches.match('./index.html',{cacheName:CACHE})).then(hit=>hit||network)));
  return;
 }
 if(url.hostname==='tile.openstreetmap.org'){event.respondWith(cacheFirst(TILES,request,()=>{trimTiles().catch(()=>{});}));return;}
 if(url.hostname==='unpkg.com'&&url.pathname.startsWith('/leaflet@1.9.4/dist/images/')){event.respondWith(cacheFirst(CACHE,request));return;}
 if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){event.respondWith(cacheFirst(CACHE,request));}
});
