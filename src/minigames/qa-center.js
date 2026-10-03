import {text,el} from '../ui/dom.js';
import {gameButton} from './shared/view.js';
import {mountMinigame,qaContext,QA_PREFIX} from './controller.js';
export function mountQaCenter(host,{storage=localStorage,onReturn=()=>{},standalone=false}={}){let dispose=null,closed=false;
 const clear=()=>{dispose?.();dispose=null;host.replaceChildren();};
 function center(result=''){clear();host.append(text('h1','小遊戲測試'));if(result)host.append(text('p',result));for(const [id,label]of [['GAME-F2','解謎小遊戲'],['GAME-D4','逃跑小遊戲']])host.append(gameButton(label,()=>choose(id,label),{class:'qa-entry'}));host.append(gameButton('返回心理測驗',()=>{clear();onReturn();}));if(standalone)host.append(text('p','C3：維持現有 Adapter／placeholder，本頁不提供卡牌玩法。','muted'));}
 function choose(id,label){clear();host.append(text('h1',label));const start=reset=>{clear();dispose=mountMinigame(id,host,qaContext(storage,id,{reset,onResult:result=>center(result.replace('DBG-','')+' · 測試完成'),onExit:()=>center()}));};const saved=id==='GAME-F2'&&storage.getItem(QA_PREFIX+id);host.append(el('div',{class:'stack'},gameButton(saved?'繼續上次測試':'開始測試',()=>start(false)),gameButton('重置進度後開始',()=>start(true)),gameButton('返回',()=>center())));}
 center();return ()=>{if(closed)return;closed=true;clear();};
}
