import {expandDeck,championOrder} from './decks.js';
import {cloneMatch,instance,units} from './model.js';
import {other} from './data.js';

// Only counts and public cards enter this boundary. No hidden card ID is read.
export function publicKnowledge(s,side){
 const opponent=other(side),p=s.players[opponent];
 const revealed=[...p.discard,...['player','enemy'].flatMap(x=>units(s,x).filter(u=>u.owner===opponent)),...Object.values(s.players).map(x=>x.continuousEffect).filter(c=>c?.owner===opponent)];
 const pool=expandDeck(opponent==='enemy'?'CHAMPION':s.playerDeck||'DUEL');
 for(const c of revealed){const i=pool.indexOf(c.cardId);if(i>=0)pool.splice(i,1);}
 return {archetype:opponent==='enemy'?'CHAMPION':s.playerDeck||'DUEL',handCount:p.hand.length,deckCount:p.deck.length,remainingPool:pool,publicIds:revealed.map(c=>c.cardId)};
}
function mix(ids,seed){const a=[...ids];let n=seed>>>0;for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function informationState(s,side,sample=0){
 const info=publicKnowledge(s,side),opp=other(side),publicPlayers={};
 // Redact before cloning: getters / identities inside opponent hand are never visited.
 for(const x of ['player','enemy']){const {hand,deck,...visible}=s.players[x];publicPlayers[x]={...visible,hand:x===side?hand:[],deck:[]};}
 const c=cloneMatch({...s,players:publicPlayers,log:[],pending:null,ui:{}});c.agents=['player','enemy'];
 const seed=17+s.roundIndex*101+sample*997+info.publicIds.join('').split('').reduce((n,x)=>n+x.charCodeAt(0),0);
 let pool=mix(info.remainingPool,seed);
 if(opp==='enemy'){
  const drawn=championOrder.length-info.deckCount,available=[...info.publicIds];
  const knownHand=championOrder.slice(0,drawn).filter(id=>{const i=available.indexOf(id);if(i<0)return true;available.splice(i,1);return false;});
  pool=[...knownHand,...championOrder.slice(drawn)];
 }
 c.players[opp].hand=Array.from({length:info.handCount},(_,i)=>instance(c,pool[i%Math.max(1,pool.length)]||'LM001',opp));
 c.players[opp].deck=Array.from({length:info.deckCount},(_,i)=>instance(c,pool[(i+info.handCount)%Math.max(1,pool.length)]||'LM001',opp));
 const own=s.players[side];
 if(side==='enemy')c.players[side].deck=cloneMatch(own.deck);
 else{
  let ownPool=expandDeck(s.playerDeck||'DUEL');
  const publicOwn=[...own.hand,...own.discard,...Object.values(s.players).flatMap(p=>Object.values(p.board).filter(u=>u?.owner===side)),...Object.values(s.players).map(p=>p.continuousEffect).filter(u=>u?.owner===side)];
  for(const card of publicOwn){const i=ownPool.indexOf(card.cardId);if(i>=0)ownPool.splice(i,1);}
  ownPool=mix(ownPool,seed+51);c.players[side].deck=Array.from({length:own.deck.length},(_,i)=>instance(c,ownPool[i%Math.max(1,ownPool.length)]||'LM001',side));
 }
 c.rngState=seed;c.eventSequence=0;return c;
}
