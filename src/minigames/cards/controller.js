import {freshMatch,freshCardsRun,championTier,recordCardsResult,ensureCardsRun,instance} from './model.js';
import {mountCards} from './view.js';
import {productionRuntimeSeed} from './runtime-seed.js';
import {expandDeck} from './decks.js';
import {shuffled} from './rules.js';
import {assertBoardOccupancy} from './board-integrity.js';
export const CARDS_QA_KEY='shitopia:qa:cards:v1:';
// Reusable boundary for future formal events. No story effect or reward lives here.
export function restoreCardsMatch(progress,{playerDeck='DUEL',tier,qaOnly=false,seed=1,rules,sourceEventId=null,enemyProfile='CARD_ENEMY_CHAMPION'}={}){
 const resolvedTier=enemyProfile==='CARD_ENEMY_DRUNK'?'MEDIUM':qaOnly&&tier?tier:championTier(progress);
 const reusable=progress.match&&!progress.match.resultDelivered&&progress.match.enemyProfile===enemyProfile&&(!sourceEventId||progress.match.sourceEventId===sourceEventId);
 let state=progress.match;
 if(!reusable){const playerDeckSeed=qaOnly?seed:productionRuntimeSeed();state=freshMatch({playerDeck,tier:resolvedTier,seed:playerDeckSeed,rules:{...rules,...(!qaOnly?{playerDeckOrderPolicy:'SEEDED_SHUFFLE'}:{})}});state.playerDeckSeed=playerDeckSeed;state.seedMode=qaOnly?'QA_SIMULATION':'PRODUCTION_RUNTIME';state.sourceEventId=sourceEventId;state.initialPlayerDeckOrder=state.players.player.deck.map(c=>c.cardId);state.enemyProfile=enemyProfile;if(enemyProfile==='CARD_ENEMY_DRUNK')state.players.enemy.deck=shuffled(state,expandDeck('DUEL')).map(id=>instance(state,id,'enemy'));}
 assertBoardOccupancy(state);state.ai.tier=resolvedTier;state.playerDeck??=playerDeck;progress.match=state;return state;
}
export function mountCardsController(host,{progress,playerDeck='DUEL',tier,qaOnly=false,seed=1,rules,sourceEventId=null,enemyProfile='CARD_ENEMY_CHAMPION',onChange=()=>{},onResult=()=>{},onExit=()=>{},...viewOptions}){
 let state;try{state=restoreCardsMatch(progress,{playerDeck,tier,qaOnly,seed,rules,sourceEventId,enemyProfile});}catch(error){if(error.name!=='BoardOccupancyError')throw error;console.error(error.message);const alert=document.createElement('p');alert.setAttribute('role','alert');alert.textContent='卡牌戰場存檔狀態異常，已停止載入；請讀取其他存檔。';host.append(alert);return ()=>alert.remove();}let sent=false;
 const persist=()=>{if(state.resultLocked&&state.winner==='enemy')recordCardsResult(progress,'FAIL');onChange(progress);};
 persist();return mountCards(host,{...viewOptions,qaOnly,state,onChange:persist,onExit:()=>{persist();onExit();},onResult:result=>{if(sent)return;sent=true;state.resultDelivered=true;recordCardsResult(progress,result);persist();onResult(result);}});
}
export function loadCardsQA(storage,key=CARDS_QA_KEY){try{return JSON.parse(storage.getItem(key))||freshCardsRun();}catch{return freshCardsRun();}}
export const formalCardsProgress=run=>ensureCardsRun(run);
