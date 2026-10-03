import {el} from '../../ui/dom.js';
import {art} from '../shared/view.js';
import {RUNNER_VISUAL} from './model.js';
export const laneCenter=lane=>(lane+.5)*100/3;
export function hazardElement(entity,path){const image=art(path,entity.type==='recovery'?'恢復道具':entity.type.startsWith('magic')?'追擊魔法':'障礙物','runner-entity');image.style.scale=RUNNER_VISUAL[entity.type];return el('div',{class:'hazard-anchor','data-type':entity.type,'data-lane':entity.lane},el('div',{class:'hazard-visual'},image));}
