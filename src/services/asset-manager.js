import {catalog} from '../data/catalog.js';
import {assetManifest} from '../data/asset-manifest.js';
import {imageURL,imagePath} from './image-source.js';
export function asset(id){return assetManifest[id]||catalog.assets[id]||{name:id,missing:true};}
export function imageElement(id,className=''){
 const a=asset(id),box=document.createElement('div');box.className='asset '+className;box.dataset.assetId=id;
 const fallback=()=>{box.replaceChildren();box.classList.add('missing');const mark=document.createElement('span');mark.className='asset-mark';mark.textContent='◇';const label=document.createElement('span');label.textContent=a.name||id;const code=document.createElement('small');code.textContent=id+' · 素材待補';box.append(mark,label,code);};
 if(!a.path||a.missing){fallback();return box;}
 const img=document.createElement('img');img.alt=a.name||id;img.decoding='async';img.fetchPriority='high';
 // Only this requested image is loaded; there is no site-wide preload.
 let usingOriginal=false,usingFallback=false,fallbackOriginal=false;
 img.onerror=()=>{if(!usingOriginal&&!usingFallback&&imagePath(a.path)!==a.path){usingOriginal=true;img.src=imageURL(a.path,true);box.dataset.fallback='original';return;}
  if(a.fallbackPath&&!usingFallback){usingFallback=true;img.src=imageURL(a.fallbackPath);box.dataset.fallback='reference';}
  else if(usingFallback&&!fallbackOriginal&&imagePath(a.fallbackPath)!==a.fallbackPath){fallbackOriginal=true;img.src=imageURL(a.fallbackPath,true);}
  else{console.warn('[Asset load failed]',id,img.src);fallback();}};
 img.src=imageURL(a.path);box.append(img);return box;
}
