import {cardTransitions} from './transition-assets.js';
export const ROUND_FALLBACK_MS=800;
export function transitionForRound(round){return cardTransitions['ROUND_'+String(round).padStart(2,'0')+'_APNG']||null;}
let playback=0;
// One new image and unique resource instance per playback, including same-round retries.
export function playCardTransition(stage,asset,{round,cancelled=()=>false}={}){
 let timer=null,finish,removed=false;
 const layer=document.createElement('div');layer.className='cards-transition';layer.dataset.transition=asset?'APNG':'ROUND_FALLBACK';layer.setAttribute('aria-live','polite');
 const duration=asset?.durationMs??ROUND_FALLBACK_MS;
 if(asset){const img=document.createElement('img'),url=new URL('../../../'+asset.path,import.meta.url);url.searchParams.set('playback',Date.now()+'-'+String(++playback));img.alt=round?'第 '+round+' 回合':'戰鬥開始';layer.dataset.asset=asset.path;layer.dataset.playback=String(playback);layer.append(img);img.src=url.href;}
 else layer.textContent='第 '+round+' 回合';
 stage.append(layer);
 const remove=()=>{if(removed)return;removed=true;clearTimeout(timer);layer.remove();finish?.(!cancelled());};
 const done=new Promise(resolve=>{finish=resolve;const img=layer.querySelector('img');const start=()=>{if(removed)return;layer.dataset.startedAt=String(performance.now());layer.dataset.durationMs=String(duration);timer=setTimeout(remove,duration);};if(img)img.decode().catch(()=>{}).then(start);else start();});
 return {done,cancel:remove,layer};
}
