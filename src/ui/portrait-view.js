import {asset,imageElement} from '../services/asset-manager.js';
export function shouldFlip(metadata,slot){return !metadata.doNotAutoFlip&&((metadata.nativeFacing||'left')==='left'?slot==='left':slot==='right');}
export function portraitElement(id,slot,active=false){
 const box=document.createElement('div');box.className='portrait portrait-position-wrapper slot-'+slot+(active?' active':'');box.dataset.portraitId=id;
 const orientation=document.createElement('div');orientation.className='portrait-orientation-wrapper'+(shouldFlip(asset(id),slot)?' flipped':'');
 const visual=document.createElement('div');visual.className='portrait-visual-wrapper';
 orientation.append(imageElement(id,'portrait-image'));visual.append(orientation);box.append(visual);return box;
}
