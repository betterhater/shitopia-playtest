import {el,text} from './dom.js';
// Narration has no nameplate; the action remains at the upper right.
export function dialogueHeader(speaker,button){return el('div',{class:'dialogue-header'},speaker?text('div',speaker,'speaker'):null,button);}
