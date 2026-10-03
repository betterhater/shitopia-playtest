import {catalog} from '../data/catalog.js';
import {assetManifest} from '../data/asset-manifest.js';
export function asset(id){return assetManifest[id]||catalog.assets[id]||{name:id,missing:true};}
export function imageElement(id,className=''){
 const a=asset(id),box=document.createElement('div');box.className='asset '+className;box.dataset.assetId=id;
 const fallback=()=>{box.replaceChildren();box.classList.add('missing');const mark=document.createElement('span');mark.className='asset-mark';mark.textContent='◇';const label=document.createElement('span');label.textContent=a.name||id;const code=document.createElement('small');code.textContent=id+' · 素材待補';box.append(mark,label,code);};
 if(!a.path||a.missing){fallback();return box;}
 const img=document.createElement('img');img.alt=a.name||id;img.decoding='async';
 // Only this requested image is loaded; there is no site-wide preload.
 let usingFallback=false;
 img.onerror=()=>{console.warn('[Asset load failed]',id,img.src);if(a.fallbackPath&&!usingFallback){usingFallback=true;img.src=new URL('../../'+a.fallbackPath,import.meta.url).href;box.dataset.fallback='reference';}else fallback();};
 img.src=new URL('../../'+a.path,import.meta.url).href;box.append(img);return box;
}
