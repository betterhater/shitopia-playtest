import {cards,other} from './data.js';
import {cloneMatch,units,livingCount} from './model.js';
import {legalPlays,play,pump,endDeploy,cardKeepValue} from './engine.js';
import {threat} from './effects.js';
import {informationState,publicKnowledge} from './public-info.js';
export const AI_CONFIG={STRONG:{beamWidth:56,maxDepth:10,maxNodes:2800,emergencyNodes:6500,maxTimeMs:2200,responseSamples:2,responseCandidates:10,responseNodes:80,yieldEvery:18},PLAYER_AGENT:{beamWidth:30,maxDepth:8,maxNodes:1200,emergencyNodes:2200,maxTimeMs:2200,responseSamples:1,responseCandidates:5,responseNodes:50,yieldEvery:18},MEDIUM:{beamWidth:1,maxDepth:1}};
export const strategyMode=(s,side)=>s.players[other(side)].shitIntent===2?'EMERGENCY':s.players[side].shitIntent===2?'WIN_NOW':'NORMAL';
export function opponentThreats(s,side){const info=publicKnowledge(s,side);return Object.fromEntries(['IE001','IE003','IE004','IE005','LM002','LM003','LM004','UM001','UM002'].map(id=>[id,Math.min(1,info.remainingPool.filter(x=>x===id).length*info.handCount/Math.max(1,info.remainingPool.length))]));}
// All forecasts execute the unchanged engine, on a public-information hypothesis.
export function projectRound(s){const c=cloneMatch(s);c.agents=['player','enemy'];pump(c);if(c.deploySide)endDeploy(c);pump(c);if(c.deploySide)endDeploy(c);pump(c);return c;}
export function futureMaterialValue(s,side){
 const p=s.players[side],known=side==='enemy'?[...p.hand,...p.deck.slice(0,3)]:p.hand,upper=known.some(c=>cards[c.cardId].type==='UM');
 return units(s,side).reduce((n,u)=>n+(upper?22:7)+(u.cardId==='LM013'?30:0)+(u.cardId==='UM003'?34:0),0);
}
export function evaluatePlan(original,candidate,side,cost=0,projected=projectRound(candidate)){
 const opp=other(side),p=projected.players[side],e=projected.players[opp];
 if(projected.resultLocked)return projected.winner===side?100000:-100000;
 const diff=p.shitIntent-original.players[side].shitIntent-(e.shitIntent-original.players[opp].shitIntent),urgent=strategyMode(original,side)!=='NORMAL'?4000:210;
 const counts=livingCount(projected,side)-livingCount(projected,opp),material=units(projected,side).reduce((n,u)=>n+threat(u),0)-units(projected,opp).reduce((n,u)=>n+threat(u),0);
 const hand=p.hand.reduce((n,c)=>n+cardKeepValue(projected,c),0),ceValue=x=>x.continuousEffect?({'CE001':12,'CE002':16,'CE003':24,'CE004':20,'CE005':8}[x.continuousEffect.cardId]||0):0;
 const info=publicKnowledge(original,side),chance=id=>info.remainingPool.filter(x=>x===id).length*info.handCount/Math.max(1,info.remainingPool.length);
 const risks=opponentThreats(original,side);
 const exposure=units(projected,side).reduce((n,u)=>n+(u.currentHp<=5?chance('IE001')*threat(u)*2:0)+(!u.frozen?chance('IE004')*threat(u)*.45:0)+(u.currentHp<=2&&!u.shield?chance('IE003')*threat(u):0)+(u.currentHp<=4&&!u.shield?risks.LM003*9:0)+(risks.IE005+risks.LM002+risks.LM004)*2+(risks.UM001+risks.UM002)*4,0);
 const upperSoon=side==='enemy'&&[...p.hand,...p.deck.slice(0,3)].some(c=>c.cardId==='UM003');
 const coreReserve=upperSoon&&p.hand.some(c=>c.cardId==='LM013')?40:0;
 const future=futureMaterialValue(projected,side)-futureMaterialValue(projected,opp)*.8+ceValue(p)-ceValue(e)+coreReserve;
 return diff*urgent+(p.shitIntent-e.shitIntent)*28+counts*28+material*2.1+future+hand*1.7-exposure-cost*.7;
}
const key=s=>JSON.stringify([s.players,s.rngState,s.resultLocked]);
function compare(a,b){
 if(a.terminalWin!==b.terminalWin)return a.terminalWin?1:-1;
 if(a.terminalLoss!==b.terminalLoss)return a.terminalLoss?-1:1;
 if(Math.abs(a.score-b.score)<1.5)return b.actions.length-a.actions.length||a.score-b.score;
 return a.score-b.score;
}
function response(c,side,budget=80){
 const original=cloneMatch(c);let spent=0;
 for(let depth=0;depth<8&&!c.resultLocked&&c.deploySide===side;depth++){
  let best=null,current=evaluatePlan(original,c,side);const emergency=strategyMode(c,side)==='EMERGENCY';
  for(const a of legalPlays(c,side)){const n=cloneMatch(c);if(!play(n,a))continue;pump(n);const value=evaluatePlan(original,n,side,depth+1);spent++;if(!best||value>best.value)best={state:n,value};if(spent>=budget)break;}
  if(!best||(!emergency&&best.value<=current))break;Object.assign(c,best.state);if(spent>=budget)break;
 }
 if(c.deploySide===side)endDeploy(c);pump(c);return c;
}
function responseForecast(candidate,side,config){
 let c=cloneMatch(candidate);if(c.deploySide===side){endDeploy(c);pump(c);}
 if(c.deploySide===other(side))c=response(c,other(side),config.responseNodes);
 return c;
}
export function* strongSearch(s,side=s.deploySide,config=AI_CONFIG.STRONG){
 const started=performance.now(),mode=strategyMode(s,side),limit=mode==='NORMAL'?config.maxNodes:config.emergencyNodes||config.maxNodes;
 const start=informationState(s,side),assess=(candidate,actions)=>{const projected=projectRound(candidate);return {s:candidate,actions,score:evaluatePlan(start,candidate,side,actions.length,projected),terminalWin:projected.resultLocked&&projected.winner===side,terminalLoss:projected.resultLocked&&projected.winner!==side};};
 let frontier=[assess(start,[])],best=frontier[0],nodes=0;const seen=new Set([key(start)]),finalists=[best];let expired=false;
 for(let depth=0;depth<config.maxDepth&&frontier.length&&nodes<limit&&!expired;depth++){
  const next=[];for(const node of frontier){if(node.s.resultLocked)continue;for(const action of legalPlays(node.s,side)){
   const c=cloneMatch(node.s);if(!play(c,action))continue;pump(c);const signature=key(c);if(seen.has(signature))continue;seen.add(signature);nodes++;
   const branch=assess(c,[...node.actions,action]);next.push(branch);if(compare(branch,best)>0)best=branch;
   if(nodes%(config.yieldEvery||18)===0){yield {nodes,mode};if(performance.now()-started>(config.maxTimeMs??2200)){expired=true;break;}}
   if(nodes>=limit)break;
  }if(nodes>=limit||expired)break;}
  frontier=next.sort((a,b)=>compare(b,a)).slice(0,config.beamWidth);finalists.push(...frontier.slice(0,config.responseCandidates||10));
 }
 const ranked=finalists.sort((a,b)=>compare(b,a)),shortlist=[assess(start,[])],diverse=new Set();
 for(const node of [best,...ranked]){const signature=node.actions.map(a=>a.instanceId).sort().join('|');if(diverse.has(signature))continue;diverse.add(signature);shortlist.push(node);if(shortlist.length>=(config.responseCandidates||10))break;}
 let robustBest=null;
 for(const node of shortlist){let total=0,worst=Infinity,allWin=true,anyLoss=false;
  for(let sample=0;sample<(config.responseSamples||1);sample++){
   const c=informationState(s,side,sample);for(const a of node.actions){if(play(c,a))pump(c);}
   const projected=responseForecast(c,side,config),value=evaluatePlan(start,c,side,node.actions.length,projected);total+=value;worst=Math.min(worst,value);allWin&&=projected.resultLocked&&projected.winner===side;anyLoss||=projected.resultLocked&&projected.winner!==side;
  }
  const branch={...node,score:total/(config.responseSamples||1)*.6+worst*.4,terminalWin:allWin,terminalLoss:anyLoss};if(!robustBest||compare(branch,robustBest)>0)robustBest=branch;yield {nodes,mode};
 }
 best=robustBest||best;
 return {actions:best.actions,score:best.score,nodes,mode,allIn:best.s.players[side].hand.length===0&&best.actions.length>0,search:'COMBINATIONS_ORDER_LANES',response:'PUBLIC_POOL_LIMITED_RESPONSE',timeLimited:expired,elapsedMs:performance.now()-started,futureIds:side==='enemy'?s.players[side].deck.slice(0,3).map(c=>c.cardId):[]};
}
export function strongPlan(s,side=s.deploySide,config=AI_CONFIG.STRONG){const search=strongSearch(s,side,config);let v;do{v=search.next();}while(!v.done);return v.value;}
export async function chooseAIPlanAsync(s,side=s.deploySide,tier=s.ai.tier,{cancelled=()=>false}={}){
 if(tier==='MEDIUM')return mediumPlan(s,side);
 const search=strongSearch(s,side);let v;do{if(cancelled())return null;v=search.next();if(!v.done)await new Promise(resolve=>setTimeout(resolve,0));}while(!v.done);return v.value;
}
export function mediumPlan(s,side=s.deploySide){
 const c=informationState(s,side),original=cloneMatch(c),actions=[];let score=evaluatePlan(original,c,side),nodes=0;const emergency=strategyMode(s,side)==='EMERGENCY';
 for(let i=0;i<12&&!c.resultLocked;i++){
  let best=null;for(const a of legalPlays(c,side)){const next=cloneMatch(c);if(!play(next,a))continue;pump(next);const value=evaluatePlan(original,next,side,actions.length+1);nodes++;if(!best||value>best.score)best={s:next,action:a,score:value};}
  if(!best||(!emergency&&best.score<=score))break;actions.push(best.action);Object.assign(c,best.s);score=best.score;
  const projected=projectRound(c);if(projected.resultLocked&&projected.winner===side||projected.players[side].shitIntent>s.players[side].shitIntent||emergency&&!(projected.resultLocked&&projected.winner!==side))break;
 }
 return {actions,score,nodes,mode:strategyMode(s,side),search:'GREEDY_LOCAL',futureIds:[]};
}
export const chooseAIPlan=(s,side=s.deploySide,tier=s.ai.tier)=>tier==='MEDIUM'?mediumPlan(s,side):strongPlan(s,side);
export function executeAIPlan(s,plan){for(const action of plan.actions){if(s.resultLocked)break;if(play(s,action))pump(s);}if(!s.resultLocked)endDeploy(s);pump(s);}
