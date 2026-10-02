import {el} from './dom.js';

// Natural flow: the browser page scrolls, and actions follow all content.
export function scenePanel(className,heading,content,actions=[]){
 return el('div',{class:className+' scene-panel'},el('div',{class:'panel-heading'},heading),el('div',{class:'panel-content'},content),el('div',{class:'panel-actions'},actions));
}
