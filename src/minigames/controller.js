import {mountPuzzle} from './puzzle/view.js';
import {mountRunner} from './runner/view.js';
import {freshPuzzle,ensurePuzzle} from './puzzle/model.js';
import {minigameAssets} from './assets.js';
import {preloadMinigame} from './shared/view.js';
// AVG and QA share this boundary. No minigame grants story rewards directly.
export const formalMinigames={
 'GAME-F2':{mount:mountPuzzle,group:'puzzle',results:{NORMAL:'DBG-F2-NORMAL',TRUE:'DBG-F2-TRUE'}},
 'GAME-D4':{mount:mountRunner,group:'runner',results:{SUCCESS:'DBG-D4-SUCCESS',FAIL:'DBG-D4-FAIL'}}
};
export function mountMinigame(id,host,context){const definition=formalMinigames[id];if(!definition)throw Error('No formal minigame '+id);preloadMinigame(Object.values(minigameAssets[definition.group]));return definition.mount(host,{...context,onResult:result=>{const mapped=definition.results[result];if(!mapped)throw Error('Invalid formal outcome');context.onResult(mapped);}});}
export function formalContext(engine,persist,done){return {name:engine.run.name,race:engine.run.race,demon:engine.run.demon,state:engine.run.pending==='GAME-F2'?ensurePuzzle(engine.run):undefined,onChange:()=>persist(),onResult:id=>{delete engine.run.minigameResume;engine.result(id);done();},onExit:()=>{if(engine.run.pending==='GAME-F2')engine.result('exit');else{engine.run.minigameResume={event:engine.run.event,node:engine.run.node};engine.leave();engine.run.location='LOC-006';}done();}};}
export const QA_PREFIX='shitopia:qa:v06:';
export function qaContext(storage,id,{reset=false,onResult,onExit}={}){const key=QA_PREFIX+id;let state=freshPuzzle();if(id==='GAME-F2'){if(reset)storage.removeItem(key);else{try{state=JSON.parse(storage.getItem(key))||state;}catch{}}}return {name:'測試者',state,onChange:s=>{if(id==='GAME-F2')storage.setItem(key,JSON.stringify(s));},onResult,onExit};}
