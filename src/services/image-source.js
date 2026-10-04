import {imageVariants} from '../data/image-variants.js';

export const imagePath = (path,original=false) => original?path:(imageVariants[path]||path);
const failedVariants=new Set();
export function imageURL(path,original=false){const url=new URL('../../'+imagePath(path,original),import.meta.url);if(path.includes('/runner/'))url.searchParams.set('v','066');return url.href;}
export function setImageSource(img,path,priority='auto'){
 img.decoding='async';img.fetchPriority=priority;let original=failedVariants.has(path);
 img.onerror=()=>{if(!original&&imageVariants[path]){original=true;failedVariants.add(path);img.src=imageURL(path,true);}else img.dataset.assetFailed='true';};
 img.src=imageURL(path,original);return img;
}
const cache=new Map();
export function loadRuntimeImage(path,{priority='low',timeout=20000}={}){
 const existing=cache.get(path);if(existing){if(priority==='high'&&existing.img)existing.img.fetchPriority='high';if(timeout===0)existing.clearDeadline?.();return existing.promise;}
 const img=new Image(),entry={img,promise:null};let finish;
 entry.promise=new Promise(resolve=>{let done=false,original=false;const timer=timeout>0?setTimeout(()=>finish(false),timeout):null;entry.clearDeadline=()=>clearTimeout(timer);
  finish=ok=>{if(done)return;done=true;clearTimeout(timer);entry.img=null;if(!ok)cache.delete(path);resolve({ok,url:ok?img.src:null});};
  img.decoding='async';img.fetchPriority=priority;
  img.onload=()=>{if(img.decode)img.decode().catch(()=>{}).then(()=>finish(true));else finish(true);};
  img.onerror=()=>{if(!original&&imageVariants[path]){original=true;img.src=imageURL(path,true);}else finish(false);};
 });cache.set(path,entry);img.src=imageURL(path);return entry.promise;
}
export function setImageBackground(node,path){
 node.dataset.assetLoad='loading';loadRuntimeImage(path,{priority:'high',timeout:0}).then(({ok,url})=>{node.dataset.assetLoad=ok?'ready':'failed';if(ok)node.style.backgroundImage=`url("${url}")`;});
}
