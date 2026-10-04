import {el,text} from '../../ui/dom.js';
import {gameButton} from '../shared/view.js';
import {cards,LANES} from './data.js';
import {currentAtk,resolveChoice,clearUIPending,cloneMatch} from './model.js';
import {legalPlays,play,endDeploy,step} from './engine.js';
import {chooseAIPlanAsync} from './ai.js';
import {artFor,cardFace,fullCardDialog} from './card-view.js';
import {bindCardPointer} from './interaction.js';
import {selectCard,selectBoardTarget,isHighlighted} from './selection.js';
import {animateEvents,majorPhase} from './animation.js';
import {showCardsVictory} from './victory-view.js';
import {runFailureTransition} from '../shared/failure-transition.js';
import {cardAssetURL} from './assets.js';
import {playCardTransition,transitionForRound} from './transitions.js';
import {cardTransitions} from './transition-assets.js';
import {BATTLEFIELD_LAYOUT,rectStyle} from './layout.js';
import {refreshPendingTargets} from './target-interaction.js';
import {boardOccupancyIssues} from './board-integrity.js';
export const RULES_TEXT=[['抽牌','雙方起手各有 3 張牌，每輪開始時各抽 1 張牌。\n手牌上限為 5 張；超過上限時先將抽牌加入手牌，再自行選擇棄牌至 5 張。'],['出牌布陣','戰場包含 1 格常駐效果區與 3 格怪獸區。\n點選手牌後點選場上合法目標，或直接拖曳卡牌至合法場格出牌。\n每輪由先攻方先布陣，再由後攻方布陣；布陣時不限制出牌數量。'],['戰鬥結算','雙方完成布陣後進入戰鬥結算。\n怪獸會依站位由左至右行動，並於戰鬥時攻擊正前方敵人。\n結算時比較雙方剩餘怪物數量，數量多者獲得該輪 1 點「屎意」。'],['決鬥勝負','雙方怪物數量相同則該輪平手，不獲得屎意。\n先取得 3 點屎意者遊戲獲勝。'],['怪獸與上位怪獸','怪獸卡直接點選或拖曳至空的我方怪獸格召喚。\n上位怪獸不能直接召喚，必須疊放於上輪存活至本輪的我方怪獸上。'],['牌庫耗盡','若在每輪正常抽牌時牌庫已無牌可抽，該方立即敗北。\n卡牌效果造成的抽牌不會導致敗北。\n若雙方同時無牌可抽，依序比較：屎意 → 場上怪物數量 → 後攻方勝。']];

export function mountCards(host,{state:s,onChange=()=>{},onResult,onExit=()=>{},qaOnly=false,paceMs=100,aiDelayMs=200,animationTimings}={}){
 let disposed=false,timer=null,renderCleanup=[],resultCleanup=null,viewer=null,selected=null,aiPlan=null,resultShown=false,busy=false,thinking=false,messageText='',pressActive=false,activeTransition=null,displayState=s;
 s.presentation??={battleStarted:s.phase!=='OPENING',roundShown:s.phase==='OPENING'?0:s.roundIndex};
 const previousBoard=new Set();s.ui={draggedCard:null,pendingTarget:null,pendingLane:null,pendingDiscard:null,selectedInstanceId:null,...s.ui};
 if(s.ui.selectedInstanceId){const c=s.players.player.hand.find(c=>c.instanceId===s.ui.selectedInstanceId);if(c){selected=selectCard(s,c);selected.target=s.ui.selectionSource||null;}}
 const root=el('section',{class:'formal-minigame cards-game plaid-sides','aria-label':'卡牌決鬥'}),stage=el('div',{class:'cards-stage',style:`background-image:url("${cardAssetURL('CARD_BATTLEFIELD_TAVERN')}")`}),status=text('div','','cards-status'),controls=el('div',{class:'cards-controls'}),dynamic=el('div',{class:'cards-dynamic'}),zone=el('div',{class:'cards-validation-zone','aria-label':'戰場出牌區'}),choices=el('div',{class:'cards-choices','aria-live':'polite'}),message=text('div','','cards-message');
 const roundLabel=text('div','','cards-round-label'),hudRow=el('div',{class:'cards-hud-row'}),playerScore=text('strong','','cards-score-number'),enemyScore=text('strong','','cards-score-number');
 status.style.cssText=rectStyle(BATTLEFIELD_LAYOUT.hud);status.append(roundLabel,hudRow);hudRow.append(el('div',{class:'cards-score player-score'},playerScore,text('small','我方屎意')),message,el('div',{class:'cards-score enemy-score'},enemyScore,text('small','敵方屎意')));
 const endButton=gameButton('',()=>commit(()=>endDeploy(s),{}),{class:'cards-end-deploy primary','aria-label':'結束布陣'});endButton.append(text('span','結束'),text('span','布陣'));
 root.append(stage);stage.append(zone,dynamic,status,choices,controls,endButton);host.append(root);
 function locked(){return busy||thinking||s.resultLocked||!!root.dataset.occupancyError;}
 function inspect(c){if(s.resultLocked||busy)return;viewer=fullCardDialog(c,()=>{viewer=null;});root.append(viewer);viewer.showModal();}
 function rules(){const d=el('dialog',{class:'cards-rules','aria-label':'決鬥規則'},text('h2','決鬥規則'),...RULES_TEXT.flatMap(([h,p])=>[text('h3',h),text('p',p)]),gameButton('關閉',()=>d.close()));d.addEventListener('close',()=>d.remove());root.append(d);d.showModal();}
 controls.append(gameButton('決鬥規則',rules));if(qaOnly)controls.append(gameButton('返回測試',()=>{if(!s.resultLocked){onChange(s);onExit();}}));
 function note(value){messageText=value;message.textContent=value;}
 function clear(){selected=null;clearUIPending(s);onChange(s);render();}
 function selectionState(){s.ui.selectedInstanceId=selected?.card.instanceId||null;s.ui.selectionSource=selected?.target||null;s.ui.pendingTarget=selected?.actions.map(a=>a.target).filter(Boolean)||null;s.ui.pendingLane=selected?.actions.map(a=>a.lane).filter(Boolean)||null;onChange(s);render();}
 function select(c){if(locked()||s.pending||s.deploySide!=='player'||s.queue.length)return;
  if(selected?.card.instanceId===c.instanceId){note('');clear();return;}
  selected=selectCard(s,c);if(!selected.actions.length){selected=null;note(cards[c.cardId].type==='SP'?'封印素材不能正常打出。':'目前沒有合法目標／站位，卡牌保留。');clearUIPending(s);onChange(s);render();return;}
  note(['LM','UM'].includes(cards[c.cardId].type)?'請點選亮起的我方場格。':selected.actions.some(a=>a.target||a.ceSide)?'請點選亮起的場上目標。':'點選戰場以發動。');selectionState();
 }
 function hitFor(node){const slot=node?.closest?.('.cards-monster-slot,.cards-ce-slot');return slot?{side:slot.closest('[data-owner]').dataset.owner,lane:slot.dataset.lane,unit:slot.dataset.unit,ce:slot.classList.contains('cards-ce-slot')}:{};}
 function boardClick(hit){if(locked())return;
  if(s.pending?.kind==='TARGET'){if(refreshPendingTargets(s)){onChange(s);render();}if(!s.pending){schedule();return;}if(hit.unit&&s.pending.options.some(o=>o.value===hit.unit))commit(()=>resolveChoice(s,hit.unit),{unit:s.pending.targetSource});else note('請選擇亮起的合法目標。');return;}
  if(!selected)return;
  const choice=selectBoardTarget(selected,hit);
  if(choice.target){selected.target=choice.target;note('請點選亮起的空格作為目的地。');selectionState();}
  else if(choice.action){const a=choice.action;selected=null;clearUIPending(s);note('');commit(()=>play(s,a),{unit:a.instanceId});}
  else note('此處不是合法目標，卡牌保留。');
 }
 function drop(c,point){if(locked())return;const landed=document.elementFromPoint(point.x,point.y);if(landed?.closest('.cards-hand')){note('請拖曳到戰場合法區域。');return;}
  selected=selectCard(s,c);if(!selected.actions.length){selected=null;note('沒有合法目標，卡牌保留。');return;}
  const type=cards[c.cardId].type,hit=hitFor(landed);
  if(type==='LM'||type==='UM')boardClick(hit);
  else if(type==='CE'||selected.actions.some(a=>!a.target&&!a.ceSide&&!a.lane))boardClick({});
  else{note('請點選亮起的場上目標。');selectionState();}
  if(selected)selectionState();
 }
 stage.addEventListener('click',e=>{if(e.target.closest('button,dialog,.cards-hand'))return;boardClick({});});
 function renderChoices(){choices.replaceChildren();
  if(busy||thinking||s.resultLocked)return;
  if(s.pending){choices.append(text('strong',s.pending.kind==='DISCARD'?'選擇棄牌':'點選亮起的目標'));if(s.pending.kind==='DISCARD')for(const o of s.pending.options)choices.append(gameButton(o.label,()=>commit(()=>resolveChoice(s,o.value),{}),{class:'cards-choice'}));return;}

 }
 const handNodes={player:new Map(),enemy:new Map()},boardNodes={},handLayers={},deckLabels={};
 const setText=(node,value)=>{if(node.textContent!==String(value))node.textContent=String(value);};
 for(const side of ['enemy','player']){
  const hand=el('div',{class:'cards-hand '+side+'-hand','aria-label':side==='player'?'玩家手牌':'敵方手牌'}),board=el('div',{class:'cards-board '+side+'-board','data-owner':side});
  handLayers[side]=hand;deckLabels[side]=text('div','','cards-deck-count '+side+'-deck-count');dynamic.append(hand,deckLabels[side],board);boardNodes[side]={};
  for(const lane of ['CE',...LANES]){
   const ce=lane==='CE',slot=el('button',{type:'button',class:ce?'cards-ce-slot':'cards-monster-slot',style:rectStyle(BATTLEFIELD_LAYOUT[side][lane]),...(ce?{}:{'data-lane':lane})});board.append(slot);boardNodes[side][lane]=slot;
   renderCleanup.push(bindCardPointer(slot,{canInteract:()=>!locked(),onPressChange:value=>pressActive=value,onInspect:()=>{const p=displayState.players[side],u=ce?p.continuousEffect:p.board[lane];if(u)inspect(u);},onTap:()=>boardClick({side,...(ce?{ce:true}:{lane,unit:displayState.players[side].board[lane]?.instanceId})})}));
  }
 }
 function render(display=s){displayState=display;
  const issues=boardOccupancyIssues(s),visualIssues=boardOccupancyIssues(display);
  if(issues.length||visualIssues.length){const detail=[...issues,...visualIssues].join('; ');if(root.dataset.occupancyError!==detail){root.dataset.occupancyError=detail;console.error('Cards occupancy invariant:',detail);s.integrityErrors??=[];s.integrityErrors.push(detail);onChange(s);}dynamic.hidden=true;endButton.hidden=true;controls.querySelectorAll('button').forEach(b=>b.disabled=true);note('卡牌戰場狀態異常，已停止疊圖；請讀取其他存檔。');return;}
  if(!busy&&refreshPendingTargets(s))onChange(s);
  root.dataset.phase=s.phase;root.dataset.aiTier=s.ai.tier;root.dataset.queue=String(s.queue.length);root.dataset.round=String(s.roundIndex);root.dataset.resultLocked=String(s.resultLocked);root.dataset.visualBusy=String(busy);root.dataset.thinking=String(thinking);
  root.dataset.interactionState=s.pending?.kind==='TARGET'?'PENDING_TARGET':s.pending?.kind||'IDLE';
  root.dataset.playerDeckSeed=String(s.playerDeckSeed??'');root.dataset.matchId=s.matchId;
  root.classList.toggle('cards--resolving',busy||thinking||!s.pending&&(s.queue.length>0||s.deploySide==='enemy'));
  setText(roundLabel,`第 ${display.roundIndex} 回合・${majorPhase(display.phase)}`);setText(playerScore,display.players.player.shitIntent);setText(enemyScore,display.players.enemy.shitIntent);setText(message,messageText);
  for(const side of ['enemy','player']){
   const p=display.players[side],hand=handLayers[side],nodes=handNodes[side],live=new Set(p.hand.map(c=>c.instanceId));
   for(const [id,{button,clean}]of nodes)if(!live.has(id)){clean();button.remove();nodes.delete(id);}
   p.hand.forEach((c,i)=>{
    let entry=nodes.get(c.instanceId);
    if(!entry){
     const button=el('button',{type:'button',class:'cards-hand-card','data-instance':c.instanceId,'data-card':c.cardId,'aria-label':side==='player'?`${cards[c.cardId].nameZh}；點選或拖曳出牌，長按或 I 查看`:'敵方手牌，牌背'},side==='enemy'?artFor('CHAMPION_CARD_BACK','card-back'):cardFace(c,{thumbnail:true}));
     const clean=side==='player'?bindCardPointer(button,{zone:stage,canDrag:cards[c.cardId].type!=='SP',canInteract:()=>!locked(),onPressChange:value=>pressActive=value,onInspect:()=>inspect(c),onTap:()=>select(c),onValidate:point=>point?drop(c,point):select(c),onDragChange:active=>{s.ui.draggedCard=active?c.instanceId:null;onChange(s);}}):()=>{};
     entry={button,clean};nodes.set(c.instanceId,entry);hand.append(button);
    }
    if(!pressActive)entry.button.style.setProperty('--fan-i',String(i-(p.hand.length-1)/2));
    entry.button.classList.toggle('card-selected',selected?.card.instanceId===c.instanceId);
   });
   setText(deckLabels[side],'牌庫 '+p.deck.length);
   for(const lane of ['CE',...LANES]){
    const slot=boardNodes[side][lane],ce=lane==='CE',u=ce?p.continuousEffect:p.board[lane],id=u?.instanceId||'';
    slot.setAttribute('aria-label',`${side==='player'?'我方':'敵方'} ${ce?'常駐效果':lane}${u?' '+cards[u.cardId].nameZh:''}`);
    slot.classList.toggle('legal-target',isHighlighted(selected,{side,...(ce?{ce:true}:{lane,unit:u?.instanceId})})||!ce&&s.pending?.kind==='TARGET'&&s.pending.options.some(o=>o.value===id));
    slot.classList.toggle('selected-source',selected?.target===id);
    if(slot.dataset.unit!==id){slot.dataset.unit=id;slot.replaceChildren();if(u){
     if(ce)slot.append(artFor(u.cardId,'ce-thumbnail'));
     else{slot.append(artFor(u.cardId,'board-monster-art'),el('div',{class:'board-stats'},text('span','','current-atk'),text('span','','current-shield'),text('span','','current-hp')),text('small','','unit-icons'));if(!previousBoard.has(id)){previousBoard.add(id);slot.classList.add('card-entering');}}
    }}
    if(u&&!ce){setText(slot.querySelector('.current-atk'),currentAtk(u));setText(slot.querySelector('.current-shield'),u.shield);setText(slot.querySelector('.current-hp'),u.currentHp);const icons=[u.burnStacks?'🔥 '+u.burnStacks:'',u.frozen?'❄':'',u.shield?'🛡 '+u.shield:''].filter(Boolean).join(' · ');setText(slot.querySelector('.unit-icons'),icons);}
   }
  }
  renderChoices();endButton.hidden=!(s.deploySide==='player'&&!s.pending&&!s.queue.length&&!s.resultLocked);endButton.disabled=locked();controls.querySelectorAll('button').forEach(b=>b.disabled=s.resultLocked||busy);
 }
 async function present(asset,round){busy=true;root.dataset.transitionBusy='true';render();activeTransition=playCardTransition(stage,asset,{round,cancelled:()=>disposed});const completed=await activeTransition.done;activeTransition=null;busy=false;root.dataset.transitionBusy='false';return completed&&!disposed;}
 function schedule(ms=paceMs){clearTimeout(timer);timer=setTimeout(tick,ms);}
 async function commit(action,task){if(disposed||busy)return;clearTimeout(timer);const before=cloneMatch(s);action();onChange(s);busy=true;render(before);
  try{await animateEvents(root,before,s,{task,render,message:note,timings:animationTimings,cancelled:()=>disposed});}finally{busy=false;if(!disposed){render();schedule();}}
 }
 async function tick(){if(disposed||busy||thinking||root.dataset.occupancyError)return;
  if(pressActive){schedule();return;}
  if(!s.presentation.battleStarted){if(!await present(cardTransitions.BATTLE_START_APNG))return;s.presentation.battleStarted=true;onChange(s);render();schedule();return;}
  if(s.phase==='OPENING'&&s.presentation.roundShown<1){if(!await present(transitionForRound(1),1))return;s.presentation.roundShown=1;onChange(s);render();schedule();return;}
  if(s.queue[0]?.op==='ROUND_BEGIN'&&s.presentation.roundShown!==s.roundIndex){if(!await present(transitionForRound(s.roundIndex),s.roundIndex))return;s.presentation.roundShown=s.roundIndex;onChange(s);render();schedule();return;}
  if(s.resultLocked){if(!resultShown){resultShown=true;selected=null;aiPlan=null;viewer?.close();render();resultCleanup=s.winner==='player'?showCardsVictory(root,s,onResult,undefined,qaOnly?'返回測試結果':'返回故事'):runFailureTransition(root,onResult);}return;}
  if(viewer||root.querySelector('dialog[open]')){schedule();return;}
  if(s.pending){if(refreshPendingTargets(s)){onChange(s);render();}if(s.pending){schedule(150);return;}}
  if(s.queue.length){const task=s.queue[0];commit(()=>step(s),task);return;}
  if(s.deploySide==='enemy'){
   if(!aiPlan){thinking=true;note((s.enemyProfile==='CARD_ENEMY_DRUNK'?'酒客':'冠軍')+'思考中…');render();try{aiPlan=await chooseAIPlanAsync(s,'enemy',s.ai.tier,{cancelled:()=>disposed});}finally{thinking=false;}if(disposed)return;note('');render();schedule(aiDelayMs);return;}
   const action=aiPlan.actions.shift();if(action)commit(()=>play(s,action),{unit:action.instanceId});else{aiPlan=null;commit(()=>endDeploy(s),{});}return;
  }
  if(s.deploySide==='player'&&!legalPlays(s).length)commit(()=>endDeploy(s),{});
 }
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&selected&&!root.querySelector('dialog[open]')){e.preventDefault();note('');clear();}});
 render();schedule();return ()=>{disposed=true;clearTimeout(timer);activeTransition?.cancel();resultCleanup?.();viewer?.close();for(const side of ['player','enemy'])for(const entry of handNodes[side].values())entry.clean();for(const f of renderCleanup)f();root.querySelectorAll('dialog').forEach(d=>d.remove());root.remove();};
}
