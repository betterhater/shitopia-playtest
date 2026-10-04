import {cards} from './data.js';
import {legalPlays} from './engine.js';

export function selectCard(s,card){return {card,actions:legalPlays(s,'player').filter(a=>a.instanceId===card.instanceId),target:null};}
export function selectBoardTarget(selected,hit){
 if(!selected||!hit)return {invalid:true};
 const actions=selected.actions.filter(a=>!selected.target||a.target===selected.target);
 const d=cards[selected.card.cardId];
 if(d.type==='LM'||d.type==='UM')return {action:actions.find(a=>hit.side==='player'&&a.lane===hit.lane)};
 if(d.type==='CE'||actions.some(a=>!a.target&&!a.ceSide&&!a.lane))return {action:actions[0]};
 if(actions.some(a=>a.target&&a.lane)){
  if(!selected.target){const candidates=actions.filter(a=>a.target===hit.unit);return candidates.length?{target:hit.unit}:{invalid:true};}
  return {action:actions.find(a=>hit.side==='player'&&a.lane===hit.lane)};
 }
 return {action:actions.find(a=>a.ceSide?hit.ce&&a.ceSide===hit.side:a.target===hit.unit)};
}
export function isHighlighted(selected,hit){
 if(!selected)return false;
 const d=cards[selected.card.cardId];
 if(['LM','UM'].includes(d.type))return selected.actions.some(a=>hit.side==='player'&&a.lane===hit.lane);
 if(selected.actions.some(a=>a.target&&a.lane))return selected.target?selected.actions.some(a=>a.target===selected.target&&hit.side==='player'&&a.lane===hit.lane):selected.actions.some(a=>a.target===hit.unit);
 return selected.actions.some(a=>a.target?hit.unit===a.target:a.ceSide?hit.ce&&a.ceSide===hit.side:d.type==='CE'&&hit.ce&&hit.side==='player');
}
