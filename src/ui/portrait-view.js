import {asset,imageElement} from '../services/asset-manager.js';
import {demonAssets,playerPortraitMeta,positionDemon} from './demon-portrait.js';
export function shouldFlip(metadata,slot){return !metadata.doNotAutoFlip&&((metadata.nativeFacing||'left')==='left'?slot==='left':slot==='right');}
export function portraitElement(id,slot,active=false,demon='DMN-NONE'){
 const box=document.createElement('div');box.className='portrait portrait-position-wrapper slot-'+slot+(active?' active':'');box.dataset.portraitId=id;
 if(['NPC-003','NPC-002'].includes(id))box.classList.add('small-friend');
 const orientation=document.createElement('div');orientation.className='portrait-orientation-wrapper'+(shouldFlip(asset(id),slot)?' flipped':'');
 const visual=document.createElement('div');visual.className='portrait-visual-wrapper';if(id==='SPR-NPC-001-DRGN')visual.classList.add('dragon-player');
 orientation.append(imageElement(id,'portrait-image'));visual.append(orientation);box.append(visual);
 const companion=demonAssets[demon];
 if(playerPortraitMeta[id]&&companion){
  const layer=document.createElement('div');layer.className='demon-wrapper';layer.dataset.demonId=demon;layer.append(imageElement(companion,'demon-image'));box.append(layer);
  const img=orientation.querySelector('img');img?.addEventListener('load',()=>positionDemon(box),{once:true});requestAnimationFrame(()=>positionDemon(box));
 }
 return box;
}
