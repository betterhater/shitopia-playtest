import {el,text} from '../../ui/dom.js';
import {assetURL} from '../assets.js';
export const gameButton=(label,fn,attrs={})=>el('button',{type:'button',onClick:fn,...attrs},label);
export const art=(path,name,cls='')=>el('img',{src:assetURL(path),alt:name,class:cls,decoding:'async',draggable:'false'});
export function gameDialog(title,content,onClose){const d=el('dialog',{class:'minigame-viewer','aria-label':title},el('div',{class:'viewer-controls'},text('strong',title),gameButton('關閉',()=>d.close())),content);d.addEventListener('close',()=>{d.remove();onClose?.();});return d;}
const preloadCache=new Map();
export function preloadMinigame(paths,timeout=1800){return Promise.all([...new Set(paths)].map(path=>{if(preloadCache.has(path))return preloadCache.get(path).promise;const img=new Image(),promise=new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),timeout);img.onload=()=>{if(img.decode)img.decode().catch(()=>{}).finally(()=>{clearTimeout(timer);resolve(true);});else{clearTimeout(timer);resolve(true);}};img.onerror=()=>{clearTimeout(timer);resolve(false);};img.src=assetURL(path);});preloadCache.set(path,{img,promise});return promise;}));}
