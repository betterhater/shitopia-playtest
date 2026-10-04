import {cards,LANES,other,SPECIAL_WIN_DARK_EXODIA} from './data.js';
import {championOrder,expandDeck} from './decks.js';
import {QA_RULES,shuffled} from './rules.js';
export const cloneMatch=s=>JSON.parse(JSON.stringify(s));
export const units=(s,side)=>LANES.map(l=>s.players[side].board[l]).filter(Boolean);
export const livingCount=(s,side)=>units(s,side).length;
export const findUnit=(s,id)=>['player','enemy'].flatMap(side=>units(s,side)).find(u=>u.instanceId===id)||null;
export const currentAtk=u=>Math.max(0,u.baseAtk+u.permanentAtkMod+u.auraAtk);
export const firstForRound=round=>round%2?'enemy':'player';
export function logEvent(s,type,data={}){s.eventSequence=(s.eventSequence||0)+1;s.log.push({sequence:s.eventSequence,type,round:s.roundIndex,phase:s.phase,...data});if(s.log.length>400)s.log.shift();}
export function instance(s,cardId,owner){const d=cards[cardId];if(!d)throw Error('Unknown card '+cardId);return {instanceId:`${s.matchId}:${++s.sequence}`,cardId,owner,controller:owner,lane:null,baseAtk:d.baseAtk,baseHp:d.baseHp,permanentAtkMod:0,permanentHpMod:0,currentHp:d.baseHp,shield:0,burnStacks:0,frozen:false,usedFlags:{},enteredRound:null,auraAtk:0,auraHp:0,auraKey:''};}
export function freshMatch({playerDeck='DUEL',seed=1,tier='STRONG',rules={},matchId='cards-'+seed,agents=['enemy']}={}){
 const s={version:1,matchId,playerDeck,enemyProfile:'CARD_ENEMY_CHAMPION',roundIndex:1,firstPlayer:'enemy',phase:'OPENING',winner:null,winReason:null,resultLocked:false,sequence:0,rngState:seed>>>0,rules:{...QA_RULES,...rules},ai:{tier,previousActualDefeat:false},agents:[...agents],players:{},queue:[],pending:null,ui:{draggedCard:null,pendingTarget:null,pendingLane:null,pendingDiscard:null,selectedInstanceId:null},log:[],deploySide:null};
 for(const side of ['player','enemy']){let order=side==='enemy'?[...championOrder]:expandDeck(playerDeck);if(side==='player'&&s.rules.playerDeckOrderPolicy==='SEEDED_SHUFFLE')order=shuffled(s,order);s.players[side]={deck:order.map(id=>instance(s,id,side)),hand:[],discard:[],continuousEffect:null,board:{L:null,M:null,R:null},shitIntent:0};}
 s.queue=[...['player','enemy'].flatMap(side=>Array.from({length:3},()=>({op:'DRAW_CARD',side,kind:'EFFECT_DRAW'}))),{op:'ROUND_BEGIN'}];return s;
}
export function finishMatch(s,winner,reason){if(s.resultLocked)return false;s.winner=winner;s.winReason=reason;s.resultLocked=true;s.phase='MATCH_OVER';s.queue=[];s.pending=null;s.deploySide=null;clearUIPending(s);logEvent(s,'MATCH_END',{winner,reason});return true;}
export function clearUIPending(s){s.ui={draggedCard:null,pendingTarget:null,pendingLane:null,pendingDiscard:null,selectedInstanceId:null};}
export function specialCheck(s,side){if(['SP001','SP002','SP003'].every(id=>s.players[side].hand.some(c=>c.cardId===id)))return finishMatch(s,side,SPECIAL_WIN_DARK_EXODIA);return false;}
export function pushFront(s,...tasks){if(!s.resultLocked)s.queue.unshift(...tasks.flat().filter(Boolean));}
export function requestChoice(s,side,kind,options,task){if(!options.length)return;pushFront(s,{op:'CHOICE',side,kind,options,task});}
export function resolveChoice(s,value){if(s.resultLocked||!s.pending||!s.pending.options.some(o=>o.value===value))return false;const p=s.pending;s.pending=null;clearUIPending(s);pushFront(s,{...p.task,selected:value});return true;}
export function drawCard(s,side,kind='EFFECT_DRAW'){
 if(s.resultLocked)return;const p=s.players[side],card=p.deck.shift();
 if(!card){logEvent(s,'EMPTY_DRAW',{side,kind});if(kind==='NORMAL_ROUND_DRAW')finishMatch(s,other(side),'NORMAL_DECK_OUT');return;}
 p.hand.push(card);logEvent(s,'HAND_ENTER',{side,cardId:card.cardId,instanceId:card.instanceId,size:p.hand.length,kind});
 if(specialCheck(s,side))return;
 if(p.hand.length>5)requestDiscard(s,side,'OVERFLOW');
}
export function requestDiscard(s,side,reason){const options=s.players[side].hand.filter(c=>!s.rules.spDiscardProtection||cards[c.cardId].type!=='SP').map(c=>({value:c.instanceId,label:cards[c.cardId].nameZh}));if(options.length)requestChoice(s,side,'DISCARD',options,{op:'DISCARD',side,reason});}
export function ensureCardsRun(run){return run.minigames.cards??=(freshCardsRun());}
export const freshCardsRun=()=>({version:1,previousActualDefeat:false,match:null});
// Legacy defeat field remains readable; formal gameplay never downgrades.
export const championTier=()=> 'STRONG';
export function recordCardsResult(state,result){if(result==='FAIL')state.previousActualDefeat=true;}
