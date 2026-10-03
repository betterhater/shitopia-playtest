import {catalog} from '../data/catalog.js';
import {el} from './dom.js';
import {imageElement} from '../services/asset-manager.js';
import {portraitElement} from './portrait-view.js';
import {applyBackdropTail} from './backdrop-tail.js';

// The AVG and minigame report use this same DOM, cast slots and stylesheet.
export function sceneFrame(content,cast,run){
 const portraits=el('div',{class:'portrait-stage'},el('div',{class:'portraits'},['left','right'].map(slot=>{
  const id=cast[slot];return id?portraitElement(id==='NPC-001'?catalog.races[run.race].sprite:id,slot,id===cast.active,run.demon):null;
 })));
 const backdrop=imageElement(run.location,'scene-backdrop'),frame=el('div',{class:'scene-frame'},backdrop,portraits,el('div',{class:'scene-overlay'},content));
 applyBackdropTail(frame,backdrop,run.location);return frame;
}
