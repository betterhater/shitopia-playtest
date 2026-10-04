import {cards,other} from './data.js';
import {cloneMatch,units} from './model.js';
import {legalPlays,play,pump} from './engine.js';
import {strongPlan,projectRound,AI_CONFIG,strategyMode} from './ai.js';
import {informationState} from './public-info.js';

// Competent local player: all legal targets, one-card marginal decisions.
// No Champion Medium reuse, combination tree or next-round fixed-order lookup.
export function mediumPlayerPlan(s,side='player'){
 const c=informationState(s,side),start=cloneMatch(c),actions=[];let nodes=0;
 const local=n=>{const p=projectRound(n);if(p.resultLocked)return p.winner===side?100000:-100000;const own=units(p,side),enemy=units(p,other(side));return (p.players[side].shitIntent-start.players[side].shitIntent)*240-(p.players[other(side)].shitIntent-start.players[other(side)].shitIntent)*280+own.length*22-enemy.length*20+own.reduce((v,u)=>v+u.currentHp+u.baseAtk,0)*1.3+n.players[side].hand.length*3;};
 for(let i=0;i<8&&!c.resultLocked;i++){
  const current=local(c);let best=null;
  for(const a of legalPlays(c,side)){const next=cloneMatch(c);if(!play(next,a))continue;pump(next);nodes++;const card=c.players[side].hand.find(x=>x.instanceId===a.instanceId),value=local(next)+(cards[card.cardId].type==='UM'?6:0);if(!best||value>best.value)best={next,a,value};}
  if(!best||best.value<=current)break;actions.push(best.a);Object.assign(c,best.next);
 }
 return {actions,nodes,mode:strategyMode(s,side),score:local(c),search:'MEDIUM_PLAYER_LOCAL_MARGINAL',futureIds:[]};
}
export function highPlayerPlan(s,side='player'){return {...strongPlan(s,side,AI_CONFIG.PLAYER_AGENT),search:'HIGH_PLAYER_COMBINATIONS_PUBLIC_CHAMPION_ORDER'};}
export const playerPolicies={MEDIUM_PLAYER_POLICY:mediumPlayerPlan,HIGH_PLAYER_POLICY:highPlayerPlan};
