import {mountPuzzle} from './puzzle/view.js';
import {mountRunner} from './runner/view.js';
import {freshPuzzle,ensurePuzzle} from './puzzle/model.js';
import {minigameAssets} from './assets.js';
import {preloadMinigame} from './shared/view.js';
import {mountCardsController,formalCardsProgress} from './cards/controller.js';
import {cardsEncounterForRun} from './cards/encounters.js';
import {cardAssets} from './cards/assets.js';
// AVG and QA share this boundary. No minigame grants story rewards directly.
export const formalMinigames={
 'GAME-C2':{mount:mountCardsController,group:'cards',results:{SUCCESS:'DBG-C2-SUCCESS',FAIL:'DBG-C2-FAIL'}},
 'GAME-C3':{mount:mountCardsController,group:'cards',results:{SUCCESS:'DBG-C3-SUCCESS',FAIL:'DBG-C3-FAIL'}},
 'GAME-F2':{mount:mountPuzzle,group:'puzzle',results:{NORMAL:'DBG-F2-NORMAL',TRUE:'DBG-F2-TRUE'}},
 'GAME-D4':{mount:mountRunner,group:'runner',results:{SUCCESS:'DBG-D4-SUCCESS',FAIL:'DBG-D4-FAIL'}}
};
export function mountMinigame(id,host,context){const definition=formalMinigames[id];if(!definition)throw Error('No formal minigame '+id);preloadMinigame(Object.values(definition.group==='cards'?cardAssets:minigameAssets[definition.group]));host.dataset.minigameType=definition.group;host.dataset.minigameController=definition.group==='cards'?'CardsController':definition.group;return definition.mount(host,{...context,onResult:result=>{const mapped=definition.results[result];if(!mapped)throw Error('Invalid formal outcome');context.onResult(mapped);}});}
export function formalContext(engine,persist,done){const run=engine.run,cards=run.pending==='GAME-C2'||run.pending==='GAME-C3';if(cards)run.activeMinigame={type:'cards',controller:'CardsController',minigameId:run.pending,sourceEventId:run.event};let sent=false;return {name:engine.run.name,race:engine.run.race,demon:engine.run.demon,...(cards?{...cardsEncounterForRun(run),progress:formalCardsProgress(run),qaOnly:false}:{}),state:run.pending==='GAME-F2'?ensurePuzzle(run):undefined,onChange:()=>persist(),onResult:id=>{if(sent)return;sent=true;delete engine.run.minigameResume;delete engine.run.activeMinigame;engine.result(id);done();},onExit:()=>{if(cards)return;if(engine.run.pending==='GAME-F2')engine.result('exit');else{engine.run.minigameResume={event:engine.run.event,node:engine.run.node};engine.leave();engine.run.location='LOC-006';}done();}};}
export const QA_PREFIX='shitopia:qa:v06:';
export function qaContext(storage,id,{reset=false,onResult,onExit}={}){const key=QA_PREFIX+id;let state=freshPuzzle();if(id==='GAME-F2'){if(reset)storage.removeItem(key);else{try{state=JSON.parse(storage.getItem(key))||state;}catch{}}}return {name:'測試者',state,onChange:s=>{if(id==='GAME-F2')storage.setItem(key,JSON.stringify(s));},onResult,onExit};}
