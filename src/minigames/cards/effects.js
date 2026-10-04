import {cards,LANES,other} from './data.js';
import {units,findUnit,currentAtk,logEvent,pushFront,requestChoice} from './model.js';
import {randomPick} from './rules.js';
export const threat=u=>currentAtk(u)*1.4+u.currentHp+u.shield*.4+({'UM003':8,'LM013':5,'LM010':6}[u.cardId]||0);
export const strongest=list=>[...list].sort((a,b)=>threat(b)-threat(a))[0]||null;
const targetOptions=list=>list.map(u=>({value:u.instanceId,label:`${u.controller==='player'?'我方':'敵方'} ${u.lane} · ${cards[u.cardId].nameZh}`}));
export function modifier(s,u,{atk=0,hp=0,shield=0,burn=0,freeze=false}={}){
 if(!u||s.resultLocked||!findUnit(s,u.instanceId))return;
 const newFreeze=freeze&&!u.frozen;
 u.permanentAtkMod+=atk;u.permanentHpMod+=hp;u.currentHp+=hp;u.shield+=shield;u.burnStacks+=burn;if(freeze)u.frozen=true;
 logEvent(s,'MODIFIER',{unit:u.instanceId,atk,hp,shield,burn,freeze});
 if(u.cardId==='LM010'&&(atk||hp||shield||burn||newFreeze))pushFront(s,{op:'DRAW_CARD',side:u.controller,kind:'EFFECT_DRAW'});
 if(u.currentHp<=0)kill(s,u,'MODIFIER');
}
export function recalculateAuras(s,{notify=true}={}){
 for(const side of ['player','enemy'])for(const u of [...units(s,side)]){
  const own=s.players[side].continuousEffect,opp=s.players[other(side)].continuousEffect;
  const keys=[];let atk=0,hp=0;
  if(own&&['CE001','CE002','CE003','CE004'].includes(own.cardId)){keys.push(own.instanceId);atk+=own.cardId==='CE004'?0:1;hp+=own.cardId==='CE001'?0:1;}
  if(opp?.cardId==='CE001'){keys.push(opp.instanceId);hp-=1;}
  const key=keys.join('|');if(key===u.auraKey)continue;
  // The pit's HP floor is applied when its numeric layer changes, never a damage event.
  const without=u.currentHp-u.auraHp;
  if(hp<0)hp=Math.max(hp,1-without);
  u.currentHp=without+hp;u.auraAtk=atk;u.auraHp=hp;const isNew=keys.some(k=>!u.auraKey.split('|').includes(k));u.auraKey=key;
  logEvent(s,'AURA',{unit:u.instanceId,atk,hp});
  if(notify&&isNew&&u.cardId==='LM010')pushFront(s,{op:'DRAW_CARD',side,kind:'EFFECT_DRAW'});
  if(u.currentHp<=0)kill(s,u,'AURA_REMOVED');
 }
}
export function removeCE(s,side){const p=s.players[side];if(!p.continuousEffect)return;p.discard.push(p.continuousEffect);logEvent(s,'CE_REMOVED',{side,cardId:p.continuousEffect.cardId});p.continuousEffect=null;recalculateAuras(s);}
export function kill(s,u,reason='DIRECT_DEATH'){
 if(!u||s.resultLocked||!findUnit(s,u.instanceId))return;
 s.players[u.controller].board[u.lane]=null;s.players[u.owner].discard.push(u);logEvent(s,'DEATH',{unit:u.instanceId,cardId:u.cardId,reason});
 if(u.cardId==='UM004'&&!u.frozen){logEvent(s,'DEATHRATTLE',{unit:u.instanceId,cardId:u.cardId});const list=units(s,u.controller);requestChoice(s,u.controller,'TARGET',targetOptions(list),{op:'MODIFIER',modifier:{atk:2}});}
}
export function damage(s,u,amount,{source=null,counter=false,reason='DAMAGE'}={}){
 if(!u||s.resultLocked||!findUnit(s,u.instanceId)||amount<=0)return;
 const shieldBefore=u.shield;
 if(u.shield>0)u.shield=Math.max(0,u.shield-amount);else u.currentHp-=amount;
 logEvent(s,'DAMAGE',{unit:u.instanceId,amount,source,counter,reason,hp:u.currentHp,shield:u.shield,shieldBefore});
 if(u.currentHp<=0)kill(s,u,reason);
 else if(u.cardId==='UM002'&&!u.frozen&&!counter)pushFront(s,{op:'ATTACK',unit:u.instanceId,counter:true});
}
export function attackTarget(s,u){return u.cardId==='LM011'?['R','M','L'].map(l=>s.players[other(u.controller)].board[l]).find(Boolean)||null:s.players[other(u.controller)].board[u.lane];}
export function attack(s,u,counter=false){
 if(!u||u.frozen||s.resultLocked)return;const target=attackTarget(s,u);
 if(!target){logEvent(s,'MISS',{unit:u.instanceId});return;}
 const before=[];
 if(u.cardId==='LM007')before.push({op:'DRAW_CARD',side:u.controller,kind:'EFFECT_DRAW'});
 if(target.cardId==='LM006'&&!target.frozen)before.push({op:'DRAW_CARD',side:target.controller,kind:'EFFECT_DRAW'});
 logEvent(s,'ATTACK',{unit:u.instanceId,target:target.instanceId,counter});
 pushFront(s,before,{op:'ATTACK_HIT',unit:u.instanceId,target:target.instanceId,counter});
}
export function hit(s,task){const u=findUnit(s,task.unit),t=findUnit(s,task.target);if(!u||!t||s.resultLocked)return;
 // Snapshot legal attack; all pre-attack draws finish before damage, and special win cancels it.
 damage(s,t,currentAtk(u),{source:u.instanceId,counter:task.counter,reason:'ATTACK'});
 if(u.cardId==='UM001'&&findUnit(s,u.instanceId))modifier(s,u,{hp:1});
}
const onceKey=(id,phase)=>id+':'+phase;
export function ability(s,u,phase){
 if(!u||s.resultLocked)return;const d=cards[u.cardId],id=u.cardId,key=onceKey(id,phase);
 const valid=d.timings.includes(phase)||(id==='LM012'&&phase===s.rules.dragonfruitTiming);
 if(!valid)return;
 const once=d.triggerLimit==='ONCE_PER_ABILITY';
 if(u.frozen){if(once&&s.rules.freezeConsumesOnce)u.usedFlags[key]=true;return;}
 if(once&&u.usedFlags[key])return;
 const own=units(s,u.controller),enemy=units(s,other(u.controller));let tasks=[];
 const choose=(list,mod)=>{if(list.length)tasks.push({op:'CHOICE',side:u.controller,kind:'TARGET',options:targetOptions(list),task:{op:'MODIFIER',modifier:mod}});};
 if(id==='LM002')choose(own.filter(x=>x!==u),{atk:2});
 if(id==='LM003'&&enemy.length)tasks=Array.from({length:4},()=>({op:'RANDOM_DAMAGE',side:other(u.controller),amount:1}));
 if(id==='LM004'){const t=randomPick(s,own);if(t)tasks=[{op:'MODIFIER',selected:t.instanceId,modifier:{shield:2}}];}
 if(id==='LM005'&&enemy.length){const max=Math.max(...enemy.map(currentAtk));choose(enemy.filter(x=>currentAtk(x)===max),{atk:-2});}
 if(id==='LM008')tasks=own.map(x=>({op:'MODIFIER',selected:x.instanceId,modifier:{hp:2,shield:1}}));
 if(id==='LM009')tasks=(phase==='ENHANCE'?own:enemy).map(x=>({op:'MODIFIER',selected:x.instanceId,modifier:{atk:phase==='ENHANCE'?2:-1}}));
 if(id==='LM012')tasks=enemy.map(x=>({op:'MODIFIER',selected:x.instanceId,modifier:{burn:1}}));
 if(id==='LM013'&&enemy.length)tasks=[{op:'RANDOM_DAMAGE',side:other(u.controller),amount:1}];
 if(id==='LM014')choose(own.filter(x=>x!==u),{shield:2});
 if(id==='UM003')tasks=phase==='ROUND_START'?[{op:'MODIFIER',selected:u.instanceId,modifier:{atk:1}}]:enemy.map(x=>({op:'DAMAGE',target:x.instanceId,amount:1}));
 if(id==='UM004'&&phase==='PROTECT')tasks=[{op:'MODIFIER',selected:u.instanceId,modifier:{shield:2}}];
 if(tasks.length){if(once)u.usedFlags[key]=true;logEvent(s,'ABILITY',{unit:u.instanceId,cardId:id,phase});pushFront(s,tasks);}
}
export function ceStart(s,side){const ce=s.players[side].continuousEffect;if(!ce||s.resultLocked)return;const own=units(s,side),enemy=units(s,other(side));
 if(ce.cardId==='CE003'&&ce.enteredRound<s.roundIndex)requestChoice(s,side,'TARGET',targetOptions(own),{op:'MODIFIER',modifier:{atk:1,hp:1}});
 if(ce.cardId==='CE004'){
  if(s.rules.sewerTarget==='CONTROLLER'){pushFront(s,own.length?{op:'CHOICE',side,kind:'TARGET',options:targetOptions(own),task:{op:'MODIFIER',modifier:{atk:1,hp:1}}}:null,enemy.length?{op:'CHOICE',side,kind:'TARGET',options:targetOptions(enemy),task:{op:'MODIFIER',modifier:{hp:1}}}:null);}
  else{const a=strongest(own),b=strongest(enemy);pushFront(s,a?{op:'MODIFIER',selected:a.instanceId,modifier:{atk:1,hp:1}}:null,b?{op:'MODIFIER',selected:b.instanceId,modifier:{hp:1}}:null);}
 }
 if(ce.cardId==='CE005'){const t=randomPick(s,own);if(t)modifier(s,t,{shield:1});}
}
export function resolveIE(s,card,action){const side=card.controller,t=findUnit(s,action.target);
 switch(card.cardId){
 case 'IE001':kill(s,t);break;
 case 'IE002': {const all=['player','enemy'].flatMap(x=>units(s,x));for(const u of all)kill(s,u);for(const x of ['player','enemy'])removeCE(s,x);break;}
 case 'IE003':if(action.ceSide)removeCE(s,action.ceSide);else damage(s,t,2);break;
 case 'IE004':modifier(s,t,{freeze:true});break;
 case 'IE005': {const from={side:t.controller,lane:t.lane};s.players[side].board[t.lane]=null;t.lane=action.lane;s.players[side].board[t.lane]=t;logEvent(s,'MOVE',{unit:t.instanceId,from,to:{side,lane:action.lane}});break;}
 case 'IE006': {const from={side:t.controller,lane:t.lane};s.players[t.controller].board[t.lane]=null;t.controller=side;t.lane=action.lane;s.players[side].board[t.lane]=t;logEvent(s,'MOVE',{unit:t.instanceId,from,to:{side,lane:action.lane}});recalculateAuras(s,{notify:false});break;}
 case 'IE007':pushFront(s,{op:'DRAW_CARD',side,kind:'EFFECT_DRAW'},{op:'RANDOM_DISCARD',side:other(side)});break;
 case 'IE008':pushFront(s,...Array.from({length:2},()=>({op:'DRAW_CARD',side,kind:'EFFECT_DRAW'})));break;
 case 'IE009':pushFront(s,...Array.from({length:2},()=>({op:'DRAW_CARD',side,kind:'EFFECT_DRAW'})),{op:'REQUEST_DISCARD',side,reason:'IE009'});break;
 case 'IE010':modifier(s,t,{shield:2});break;
 }
}
