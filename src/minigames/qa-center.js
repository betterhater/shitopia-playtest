import {text,el} from '../ui/dom.js';
import {gameButton} from './shared/view.js';
import {mountMinigame,qaContext,QA_PREFIX} from './controller.js';
import {mountCardsController,loadCardsQA,CARDS_QA_KEY} from './cards/controller.js';
import {freshCardsRun,championTier} from './cards/model.js';
import {QA_RULES} from './cards/rules.js';
export function mountQaCenter(host,{storage=localStorage,onReturn=()=>{},standalone=false}={}){let dispose=null,closed=false;
 const clear=()=>{dispose?.();dispose=null;host.replaceChildren();};
 function center(result=''){clear();host.append(text('h1','小遊戲測試'));if(result)host.append(text('p',result));for(const [id,label]of [['GAME-F2','解謎小遊戲'],['GAME-D4','逃跑小遊戲']])host.append(gameButton(label,()=>choose(id,label),{class:'qa-entry'}));host.append(gameButton('卡牌決鬥',chooseCards,{class:'qa-entry'}));host.append(gameButton('返回心理測驗',()=>{clear();onReturn();}));if(standalone)host.append(text('p','C2／C3 已接入正式 AVG；此 QA 入口獨立保存，不發放劇情獎勵。','muted'));}
 function chooseCards(){clear();let progress=loadCardsQA(storage);host.append(text('h1','卡牌決鬥'));
  const select=(label,options,value)=>{const n=el('select',{'aria-label':label},...options.map(([v,t])=>el('option',{value:v},t)));n.value=value;host.append(el('label',{class:'cards-qa-field'},text('span',label),n));return n;};
  const deck=select('玩家牌組',[['DUEL','決鬥牌組'],['GREAT','大屎牌組']],progress.playerDeck||'DUEL'),enemy=select('敵方',[['CARD_ENEMY_CHAMPION','冠軍'],['CARD_ENEMY_DRUNK','酒客難度']],progress.match?.enemyProfile||'CARD_ENEMY_CHAMPION'),tier=select('冠軍 AI（僅 QA 可指定）',[['STRONG','STRONG'],['MEDIUM','MEDIUM']],progress.match?.ai?.tier||'STRONG'),order=select('玩家牌序（未鎖定；QA 設定）',[['SEEDED_SHUFFLE','Seeded shuffle'],['LIST_ORDER','牌表順序']],QA_RULES.playerDeckOrderPolicy),ce=select('CE 滿格（未鎖定）',[['REPLACE','替換（QA 預設）'],['BLOCK','不替換']],QA_RULES.ceReplacement),sewer=select('下水道目標（未鎖定）',[['CONTROLLER','控制者選擇'],['THREAT','威脅策略']],QA_RULES.sewerTarget),fruit=select('火龍果 timing（未鎖定）',[['ENHANCE','強化'],['PROTECT','防護'],['WEAKEN','削弱'],['BATTLE_ACTIONS','戰鬥']],QA_RULES.dragonfruitTiming);
  const seed=el('input',{type:'number',value:'104','aria-label':'測試 seed',min:'1'});host.append(el('label',{class:'cards-qa-field'},text('span','測試 seed'),seed));
 const start=(reset=false)=>{if(reset)progress=freshCardsRun();progress.playerDeck=deck.value;const options={progress,playerDeck:deck.value,enemyProfile:enemy.value,qaOnly:true,tier:tier.value,seed:Number(seed.value)||1,rules:{playerDeckOrderPolicy:order.value,ceReplacement:ce.value,sewerTarget:sewer.value,dragonfruitTiming:fruit.value},onChange:p=>storage.setItem(CARDS_QA_KEY,JSON.stringify(p)),onResult:r=>center('CARDS '+r+' · 測試完成'),onExit:()=>center()};clear();dispose=mountCardsController(host,options);};
  host.append(text('p',`正式冠軍固定 STRONG；本 QA 可手動指定 STRONG／MEDIUM。`),text('p','卡牌規則 v0.2；上述未鎖定設定僅供測試，不代表正式裁定。','muted'),gameButton(progress.match&&!progress.match.resultDelivered?'繼續上次對局':'開始冠軍對局',()=>start()),gameButton('新 QA 周目並開始',()=>start(true)),gameButton('返回',()=>center()));
 }
 function choose(id,label){clear();host.append(text('h1',label));const start=reset=>{clear();dispose=mountMinigame(id,host,qaContext(storage,id,{reset,onResult:result=>center(result.replace('DBG-','')+' · 測試完成'),onExit:()=>center()}));};const saved=id==='GAME-F2'&&storage.getItem(QA_PREFIX+id);host.append(el('div',{class:'stack'},gameButton(saved?'繼續上次測試':'開始測試',()=>start(false)),gameButton('重置進度後開始',()=>start(true)),gameButton('返回',()=>center())));}
 center();return ()=>{if(closed)return;closed=true;clear();};
}
