import {el,text} from './dom.js';
import {imageElement} from '../services/asset-manager.js';
import {catalog} from '../data/catalog.js';
export function endingVisual(id,name){return el('div',{class:'ending-visual','data-ending-id':id},imageElement(id,'ending-art'),el('div',{class:'ending-story-panel'},text('p',catalog.endings[id].text.replaceAll('用戶名',name),'ending-story')));}
