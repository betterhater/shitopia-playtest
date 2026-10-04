import {cards,LANES,other,PHASES} from './data.js';
import {units,findUnit,firstForRound,logEvent,pushFront,drawCard,requestDiscard,finishMatch,livingCount,currentAtk} from './model.js';
import {ability,ceStart,recalculateAuras,removeCE,resolveIE,modifier,damage,attack,hit,threat} from './effects.js';
import {randomPick} from './rules.js';
export function actionQueue(s){const sides=[s.firstPlayer,other(s.firstPlayer)],lists=sides.map(side=>units(s,side).map(u=>u.instanceId)),out=[];while(lists.some(a=>a.length))for(const list of lists)if(list.length)out.push(list.shift());return out;}
export function legalPlays(s,side=s.deploySide){
 if(s.resultLocked||s.pending||s.queue.length||s.deploySide!==side)return [];const own=units(s,side),enemy=units(s,other(side)),p=s.players[side],empty=LANES.filter(l=>!p.board[l]);const all=[...own,...enemy],actions=[];
 for(const c of p.hand){const d=cards[c.cardId],base={instanceId:c.instanceId};
  if(d.type==='LM')for(const lane of empty)actions.push({...base,lane});
  if(d.type==='UM')for(const u of own.filter(u=>u.enteredRound<s.roundIndex))actions.push({...base,lane:u.lane});
  if(d.type==='CE'&&(!p.continuousEffect||s.rules.ceReplacement==='REPLACE'))actions.push(base);
  if(d.type!=='IE')continue;
  switch(c.cardId){
  case 'IE001':for(const u of enemy.filter(u=>u.currentHp<=5))actions.push({...base,target:u.instanceId});break;
  case 'IE002':case 'IE007':case 'IE008':case 'IE009':actions.push(base);break;
  case 'IE003':for(const u of all)actions.push({...base,target:u.instanceId});for(const ceSide of ['player','enemy'])if(s.players[ceSide].continuousEffect)actions.push({...base,ceSide});break;
  case 'IE004':for(const u of all)actions.push({...base,target:u.instanceId});break;
  case 'IE005':for(const u of own)for(const lane of empty)actions.push({...base,target:u.instanceId,lane});break;
  case 'IE006':for(const u of enemy)for(const lane of empty)actions.push({...base,target:u.instanceId,lane});break;
  case 'IE010':for(const u of own)actions.push({...base,target:u.instanceId});break;
  }
 }
 return actions;
}
export function play(s,action){if(!legalPlays(s).some(a=>JSON.stringify(a)===JSON.stringify(action)))return false;const side=s.deploySide,p=s.players[side],i=p.hand.findIndex(c=>c.instanceId===action.instanceId),c=p.hand.splice(i,1)[0],d=cards[c.cardId];
 logEvent(s,'PLAY',{side,cardId:c.cardId,...action});
 if(d.type==='LM'||d.type==='UM'){
  const old=p.board[action.lane];c.lane=action.lane;c.enteredRound=s.roundIndex;
  if(old){c.permanentAtkMod=old.permanentAtkMod;c.permanentHpMod=old.permanentHpMod;c.currentHp=c.baseHp+c.permanentHpMod;c.shield=old.shield;c.burnStacks=old.burnStacks;c.frozen=old.frozen;p.discard.push(old);}
  p.board[c.lane]=c;recalculateAuras(s);
 }else if(d.type==='CE'){removeCE(s,side);c.enteredRound=s.roundIndex;p.continuousEffect=c;recalculateAuras(s);}
 else {p.discard.push(c);resolveIE(s,c,action);}
 return true;
}
export function endDeploy(s){if(s.resultLocked||s.pending||s.queue.length||!s.deploySide)return false;const first=s.deploySide===s.firstPlayer;s.deploySide=null;if(first)pushFront(s,{op:'DEPLOY',side:other(s.firstPlayer),phase:'SECOND_DEPLOY'});else pushFront(s,...['ENHANCE','PROTECT','WEAKEN','BATTLE_START','BATTLE_ACTIONS','ROUND_SCORE','ROUND_END','MATCH_END_CHECK'].map(phase=>({op:'PHASE',phase})));return true;}
export function choiceHeuristic(s,p){if(p.kind==='DISCARD'){const hand=s.players[p.side].hand;const ranked=p.options.map(o=>({o,c:hand.find(c=>c.instanceId===o.value)}));ranked.sort((a,b)=>cardKeepValue(s,a.c)-cardKeepValue(s,b.c));return ranked[0].o.value;}
 return [...p.options].sort((a,b)=>{const x=findUnit(s,a.value),y=findUnit(s,b.value);const negative=(p.task.modifier?.atk||0)<0||x?.controller!==p.side;return negative?threat(y)-threat(x):threat(y)-threat(x);})[0].value;
}
export function cardKeepValue(s,c){const d=cards[c.cardId];if(d.type==='SP')return 25+5*s.players[c.controller].hand.filter(x=>cards[x.cardId].type==='SP').length;return d.type==='UM'?9:d.type==='LM'?d.baseAtk+d.baseHp+3:d.type==='CE'?7:['IE008','IE009','IE006','IE001'].includes(c.cardId)?10:5;}
export function step(s){if(s.resultLocked||s.pending||!s.queue.length)return false;const task=s.queue.shift();switch(task.op){
 case 'ROUND_BEGIN':s.firstPlayer=firstForRound(s.roundIndex);pushFront(s,{op:'PHASE',phase:'ROUND_START'},{op:'PHASE',phase:'DRAW'},{op:'DEPLOY',side:s.firstPlayer,phase:'FIRST_DEPLOY'});break;
 case 'PHASE':{
  s.phase=task.phase;logEvent(s,'PHASE',{name:task.phase});
  if(task.phase==='DRAW'){const empty=['player','enemy'].filter(side=>!s.players[side].deck.length);if(empty.length===2){const a=s.players.player.shitIntent-s.players.enemy.shitIntent,b=livingCount(s,'player')-livingCount(s,'enemy');finishMatch(s,a? a>0?'player':'enemy':b?b>0?'player':'enemy':other(s.firstPlayer),'BOTH_DECK_OUT');}else if(empty.length)finishMatch(s,other(empty[0]),'NORMAL_DECK_OUT');else pushFront(s,...[s.firstPlayer,other(s.firstPlayer)].map(side=>({op:'DRAW_CARD',side,kind:'NORMAL_ROUND_DRAW'})));}
  else if(task.phase==='ROUND_START')pushFront(s,...[s.firstPlayer,other(s.firstPlayer)].map(side=>({op:'CE_START',side})),...actionQueue(s).map(unit=>({op:'ABILITY',unit,phase:'ROUND_START'})));
  else if(['ENHANCE','PROTECT','WEAKEN'].includes(task.phase))pushFront(s,...actionQueue(s).map(unit=>({op:'ABILITY',unit,phase:task.phase})));
  else if(task.phase==='BATTLE_START')pushFront(s,...actionQueue(s).map(target=>({op:'BURN',target})));
  else if(task.phase==='BATTLE_ACTIONS')pushFront(s,...actionQueue(s).map(unit=>({op:'ATTACK',unit,counter:false})));
  else if(task.phase==='ROUND_SCORE'){const a=livingCount(s,'player'),b=livingCount(s,'enemy'),winner=a>b?'player':b>a?'enemy':null;if(winner)s.players[winner].shitIntent++;logEvent(s,'ROUND_SCORE',{winner,counts:{player:a,enemy:b}});}
  else if(task.phase==='ROUND_END')pushFront(s,...actionQueue(s).map(unit=>({op:'ABILITY',unit,phase:'ROUND_END'})),{op:'CLEAR_ROUND_STATUS'});
  else if(task.phase==='MATCH_END_CHECK'){const winner=['player','enemy'].find(side=>s.players[side].shitIntent>=3);if(winner)finishMatch(s,winner,'SHIT_INTENT');else{s.roundIndex++;pushFront(s,{op:'ROUND_BEGIN'});}}
  break;}
 case 'DEPLOY':s.phase=task.phase;s.deploySide=task.side;break;
 case 'DRAW_CARD':drawCard(s,task.side,task.kind);break;
 case 'CHOICE':if(task.kind==='TARGET')task.options=task.options.filter(o=>findUnit(s,o.value));if(!task.options.length)break;if(s.agents.includes(task.side))pushFront(s,{...task.task,selected:choiceHeuristic(s,task)});else {s.pending=task;s.ui??={};s.ui[task.kind==='DISCARD'?'pendingDiscard':'pendingTarget']=task.options.map(o=>o.value);}break;
 case 'DISCARD':{const p=s.players[task.side],i=p.hand.findIndex(c=>c.instanceId===task.selected);if(i>=0)p.discard.push(p.hand.splice(i,1)[0]);logEvent(s,'DISCARD',{side:task.side,reason:task.reason});if(p.hand.length>5)requestDiscard(s,task.side,'OVERFLOW');break;}
 case 'REQUEST_DISCARD':requestDiscard(s,task.side,task.reason);break;
 case 'RANDOM_DISCARD':{const p=s.players[task.side],c=randomPick(s,p.hand);if(c)p.discard.push(p.hand.splice(p.hand.indexOf(c),1)[0]);break;}
 case 'MODIFIER':modifier(s,findUnit(s,task.selected),task.modifier);break;
 case 'ABILITY':ability(s,findUnit(s,task.unit),task.phase);break;
 case 'CE_START':ceStart(s,task.side);break;
 case 'DAMAGE':damage(s,findUnit(s,task.target),task.amount);break;
 case 'RANDOM_DAMAGE':damage(s,randomPick(s,units(s,task.side)),task.amount);break;
 case 'BURN':{const u=findUnit(s,task.target);if(u?.burnStacks)damage(s,u,u.burnStacks,{reason:'BURN'});break;}
 case 'ATTACK':attack(s,findUnit(s,task.unit),task.counter);break;
 case 'ATTACK_HIT':hit(s,task);break;
 case 'CLEAR_ROUND_STATUS':for(const side of ['player','enemy'])for(const u of units(s,side)){u.shield=0;u.frozen=false;}break;
 default:throw Error('Unknown Cards task '+task.op);
 }return true;}
export function pump(s,limit=2000){let n=0;while(step(s)){if(++n>limit)throw Error('Cards queue runaway');}return s;}
export {PHASES};
