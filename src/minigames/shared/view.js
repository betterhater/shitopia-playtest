import {el,text} from '../../ui/dom.js';
import {assetURL} from '../assets.js';
import {setImageSource,loadRuntimeImage} from '../../services/image-source.js';
export const gameButton=(label,fn,attrs={})=>el('button',{type:'button',onClick:fn,...attrs},label);
export const art=(path,name,cls='')=>setImageSource(el('img',{alt:name,class:cls,draggable:'false'}),path,'high');
export function gameDialog(title,content,onClose){const d=el('dialog',{class:'minigame-viewer','aria-label':title},el('div',{class:'viewer-controls'},text('strong',title),gameButton('關閉',()=>d.close())),content);d.addEventListener('close',()=>{d.remove();onClose?.();});return d;}
export function preloadMinigame(paths,timeout=20000,{critical=[]}={}){
 let cancelled=false;const immediate=[...new Set(critical)].filter(Boolean),remaining=[...new Set(paths)].filter(p=>p&&!immediate.includes(p));
 const promise=(async()=>{
  await Promise.all(immediate.map(p=>loadRuntimeImage(p,{priority:'high',timeout})));
  if(cancelled)return;
  await new Promise(resolve=>{if(globalThis.requestIdleCallback)globalThis.requestIdleCallback(resolve,{timeout:1200});else setTimeout(resolve,100);});
  const worker=async()=>{while(!cancelled&&remaining.length){const path=remaining.shift();await loadRuntimeImage(path,{priority:'low',timeout});}};
  await Promise.all([worker(),worker()]);
 })();promise.cancel=()=>{cancelled=true;};return promise;
}
