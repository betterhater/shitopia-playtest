import {el} from './dom.js';

// Shared fixed panel: the content scrolls; actions always occupy the bottom row.
export function scenePanel(className,heading,content,actions=[]){
 return el('div',{class:className+' scene-panel'},el('div',{class:'panel-heading'},heading),el('div',{class:'panel-content',tabindex:0},content),el('div',{class:'panel-actions'},actions));
}
