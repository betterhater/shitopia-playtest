import {cards} from './data.js';
import {cloneMatch,findUnit} from './model.js';
export const CARD_ANIMATION_TIMINGS={effectHighlightMs:442,statFlashMs:585,attackWindupMs:286,attackMoveMs:468,hitFlashMs:507,deathMs:624,betweenActionsMs:130};
export const majorPhase=phase=>['OPENING','ROUND_START','DRAW'].includes(phase)?'抽牌':['FIRST_DEPLOY','SECOND_DEPLOY'].includes(phase)?'布陣':'戰鬥';
export function visualEvents(before,after){return after.log.filter(e=>(e.sequence||0)>(before.eventSequence||0));}
const labels={ATTACK:'攻擊',DEATH:'消滅',DEATHRATTLE:'遺言',MOVE:'移動',MISS:'揮空',CE_REMOVED:'常駐效果離場',ROUND_SCORE:'屎意結算',HAND_ENTER:'抽牌'};
export function eventMessage(e){
 if(e.type==='MODIFIER')return [e.atk?(e.atk>0?'+':'')+e.atk+' ATK':'',e.hp?(e.hp>0?'+':'')+e.hp+' HP':'',e.shield?'Shield +'+e.shield:'',e.burn?'🔥 +'+e.burn:'',e.freeze?'❄ 冰凍':''].filter(Boolean).join(' · ');
 if(e.type==='DAMAGE')return e.shieldBefore>0?'護盾抵擋':(e.reason==='BURN'?'🔥 燃燒 ':'')+'−'+e.amount+' HP';
 if(e.type==='ABILITY')return cards[e.cardId].nameZh+'：'+(e.phase==='ROUND_END'?'輪末效果':'效果');
 return e.counter?'反擊':labels[e.type]||'';
}
// Presentation-only queue. Rules commit once, then each log event receives visible time.
export async function animateEvents(root,before,after,{render,message,task={},timings=CARD_ANIMATION_TIMINGS,cancelled=()=>false}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,wait=ms=>new Promise(r=>setTimeout(r,reduced?Math.min(30,ms):ms));
 let visual=cloneMatch(before),source=task.unit||[...before.log].reverse().find(e=>e.type==='ABILITY')?.unit||null;
 const slot=id=>[...root.querySelectorAll('[data-unit]')].find(n=>n.dataset.unit===id);
 const pulse=async(id,kind,label,ms)=>{const n=slot(id);if(!n){await wait(ms);return;}n.classList.add('fx-'+kind);const pop=document.createElement('span');pop.className='card-floating fx-text-'+kind;pop.textContent=label;n.append(pop);await wait(ms);n.classList.remove('fx-'+kind);pop.remove();};
 for(const e of visualEvents(before,after)){
  if(cancelled())return;
  const raw=eventMessage(e),target=findUnit(visual,e.unit)||findUnit(after,e.unit),name=target?cards[target.cardId].nameZh:'',origin=findUnit(before,source)||findUnit(after,source),msg=e.type==='MODIFIER'&&origin?.cardId==='LM002'&&e.atk===2?`大屎塊使 ${name} 獲得 +2 ATK`:raw&&name&&['MODIFIER','AURA','DAMAGE','ATTACK','DEATH','MOVE'].includes(e.type)?name+'：'+raw:raw;if(msg)message(msg,e);
  root.dataset.visualEvent=e.type;root.dataset.visualSequence=String(e.sequence);
  if(e.type==='ABILITY'){source=e.unit;await pulse(source,'source',msg,timings.effectHighlightMs);}
  if(e.type==='PLAY'){
   source=e.instanceId;
   const played=after.players[e.side].board[e.lane]||after.players[e.side].continuousEffect;
   visual.players[e.side].hand=visual.players[e.side].hand.filter(c=>c.instanceId!==e.instanceId);
   if(played?.instanceId===e.instanceId){if(e.lane){const u=cloneMatch(played);u.currentHp-=u.auraHp;u.auraHp=0;u.auraAtk=0;visual.players[e.side].board[e.lane]=u;}else visual.players[e.side].continuousEffect=cloneMatch(played);render(visual);await pulse(source,'source',cards[e.cardId].nameZh,timings.effectHighlightMs);}
  }
  if(e.type==='ATTACK'){
   const a=slot(e.unit),b=slot(e.target);if(e.counter)await pulse(e.unit,'source','反擊',timings.effectHighlightMs);
   if(a&&b){a.classList.add('fx-source');await wait(timings.attackWindupMs);const x=a.getBoundingClientRect(),y=b.getBoundingClientRect(),dx=(y.x+y.width/2-x.x-x.width/2)*.5,dy=(y.y+y.height/2-x.y-x.height/2)*.5;
    const anim=a.animate([{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:reduced?30:timings.attackMoveMs,easing:'ease-in-out'});await anim.finished.catch(()=>{});a.classList.remove('fx-source');}
  }
  if(['MODIFIER','AURA'].includes(e.type)){
   const u=findUnit(visual,e.unit);if(u){
    if(e.type==='MODIFIER'){u.permanentAtkMod+=e.atk;u.currentHp+=e.hp;u.shield+=e.shield;u.burnStacks+=e.burn;if(e.freeze)u.frozen=true;}
    else{u.currentHp+=e.hp-u.auraHp;u.auraAtk=e.atk;u.auraHp=e.hp;}
    render(visual);
   }
   const kinds=e.type==='AURA'?[['atk',e.atk],['hp',e.hp]]:[['atk',e.atk],['hp',e.hp],['shield',e.shield],['burn',e.burn],['freeze',e.freeze]];
   for(const [kind,value]of kinds.filter(([,v])=>v)){const color=kind==='atk'&&value<0?'debuff':kind;const label=kind==='freeze'?'❄ 冰凍':kind==='burn'?'🔥 +'+value:kind==='shield'?'Shield +'+value:(value>0?'+':'')+value+' '+kind.toUpperCase();const origin=slot(source);origin?.classList.add('fx-'+color);await pulse(e.unit,color,label,timings.statFlashMs);origin?.classList.remove('fx-'+color);}
  }
  if(e.type==='DAMAGE'){
   const u=findUnit(visual,e.unit);if(u){u.currentHp=e.hp;u.shield=e.shield;render(visual);}
   await pulse(e.unit,e.shieldBefore>0?'shield':'hit',e.shieldBefore>0?'🛡 抵擋':'−'+e.amount,timings.hitFlashMs);
  }
  if(e.type==='DEATH'){
   await pulse(e.unit,'death',e.reason==='DIRECT_DEATH'?'湮滅':'消滅',timings.deathMs);
   const u=findUnit(visual,e.unit);if(u)visual.players[u.controller].board[u.lane]=null;render(visual);
  }
  if(e.type==='DEATHRATTLE')await pulse(source,'source','遺言',timings.effectHighlightMs);
  if(e.type==='MOVE'){
   const from=slot(e.unit),dest=root.querySelector(`[data-owner="${e.to.side}"] [data-lane="${e.to.lane}"]`);
   if(from&&dest){const a=from.getBoundingClientRect(),b=dest.getBoundingClientRect();const anim=from.animate([{transform:'translate(0,0)'},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px)`}],{duration:reduced?30:timings.attackMoveMs,fill:'forwards',easing:'ease-in-out'});try{await anim.finished.catch(()=>{});}finally{anim.cancel();}}
   const u=findUnit(visual,e.unit);if(u){visual.players[e.from.side].board[e.from.lane]=null;u.controller=e.to.side;u.lane=e.to.lane;visual.players[e.to.side].board[e.to.lane]=u;}render(visual);
  }
  if(msg)await wait(timings.betweenActionsMs);
 }
 if(!cancelled())render(after);
}
