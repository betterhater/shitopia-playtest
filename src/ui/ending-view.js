import {el,text} from './dom.js';
import {imageElement} from '../services/asset-manager.js';
import {catalog} from '../data/catalog.js';
import {observeEndingText} from './ending-fit.js';
export function endingVisual(id,name){const panel=el('div',{class:'ending-story-panel'},text('p',catalog.endings[id].text.replaceAll('用戶名',name),'ending-story'));const root=el('div',{class:'ending-visual','data-ending-id':id},imageElement(id,'ending-art'),panel);observeEndingText(panel);return root;}
