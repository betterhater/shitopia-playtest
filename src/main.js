import {catalog} from './data/catalog.js';
import {graph,raw,interactions} from './data/story.js';
import {createGame} from './engine/state.js';
import {Engine} from './engine/game.js';
import {startQuiz,scoreQuiz,raceOrder,REALISTIC_MODE_ENABLED,validName} from './engine/quiz.js';
import {grant} from './engine/achievements.js';
import {SaveManager} from './services/storage.js';
import {imageElement} from './services/asset-manager.js';
import {AudioManager} from './services/audio-manager.js';
import {decodePublic,shareURL,shareText,makeImage,copyText,download} from './services/share.js';
import {adapters} from './minigames/adapter.js';
import {el,text} from './ui/dom.js';
import {visibleTargets,interactionTarget} from './ui/location-targets.js';
import {LOCKED_MESSAGE,lockedProgression} from './ui/requirements.js';
import {NotificationQueue} from './ui/notification-queue.js';
import {hubFor,isHub,onwardDestinations} from './ui/navigation.js';
import {resolveCast} from './ui/scene-cast.js';
import {ownedItems} from './ui/inventory-view.js';
import {parseSpeech as parseSourceSpeech} from './ui/speech.js';
import {visibleOption,askedBefore,targetOptions,directOptions,libraryObservation} from './ui/exploration-options.js';
import {scenePanel} from './ui/scene-panel.js';
import {normalizeDisplayText} from './ui/display-text.js';
import {sceneFrame as sharedSceneFrame} from './ui/scene-frame.js';
import {fitScene} from './ui/scene-layout.js';
import {storyLineText} from './ui/story-line.js';
import {positionFlush,FLUSH_TIMING} from './ui/flush-geometry.js';
import {endingVisual} from './ui/ending-view.js';
import {credits} from './data/credits.js';
import {walkthrough,spoilerWarning} from './data/walkthrough.js';
import {AssetPreloader} from './services/asset-preloader.js';
import {formalMinigames,mountMinigame,formalContext} from './minigames/controller.js';
import {PLAYTEST_MINIGAME_ENTRY_ENABLED} from './data/features.js';
import {mountQaCenter} from './minigames/qa-center.js';
import {dialogueHeader} from './ui/dialogue-header.js';
import {anchorNotices} from './ui/notice-anchor.js';

const app=document.querySelector('#app'),dialog=document.querySelector('#modal'),notice=document.querySelector('#notice');
const game=createGame(),engine=new Engine(game),saves=new SaveManager();
let screen='home',publicData=decodePublic(location.hash),flushTimer,flushing=false,session={},activeShareURL=null,selectedMode='normal';
let selectedTarget=null;
let disposeMinigame=null,disposeNoticeAnchor=null;
const preloader=new AssetPreloader();
let settings={volume:.35,mute:false};
try{const m=saves.read('meta');if(m)Object.assign(game.meta,m);Object.assign(settings,saves.read('settings')||{});session=saves.read('session')||{};if(session.quiz)game.quiz=session.quiz;if(session.screen==='game'&&saves.peek('auto')){saves.load('auto',game);game.run.sceneCast=null;screen='game';}else if(['quiz','result','demon'].includes(session.screen))screen=session.screen;selectedMode=session.selectedMode||'normal';}catch(e){setTimeout(()=>notify(e.message),100);}
const audio=new AudioManager(settings);
const notificationQueue=new NotificationQueue({mount:entry=>{const card=el('div',{class:'notice-item '+entry.kind,role:'status','data-notice-id':entry.id},el('strong',{},entry.kind==='item'?'◆ 道具':entry.kind==='achievement'?'★ 成就':entry.kind==='knowledge'?'知識':'提示'),text('span',entry.message));notice.append(card);card.addEventListener('click',()=>notificationQueue.dismiss(entry.id));},unmount:entry=>{const card=notice.querySelector(`[data-notice-id="${entry.id}"]`);if(card){card.classList.add('leaving');setTimeout(()=>card.remove(),260);}}});
function notify(value){notificationQueue.enqueue(value);}
function action(fn){return async()=>{audio.click();try{await fn();}catch(e){notify(e.message);console.error(e);}};}
const button=(label,fn,cls='',disabled=false)=>el('button',{type:'button',class:cls,disabled,onClick:action(fn)},label);
function persist(auto=false){saves.meta(game.meta);saves.write('session',{screen,quiz:game.quiz,selectedRace:session.selectedRace,selectedMode});if(auto&&game.run)saves.save('auto',game);notificationQueue.enqueueBatch(game.notices||[]);game.notices=[];}
function after(auto=true){persist(auto);render();}
function loadSave(slot){saves.load(slot,game);game.run.sceneCast=null;selectedTarget=null;publicData=null;screen='game';closeModal();after();}
function closeModal(){dialog.close();if(activeShareURL){URL.revokeObjectURL(activeShareURL);activeShareURL=null;}}
function modal(title,body){dialog.replaceChildren(el('div',{class:'modal-head'},text('h2',title),button('關閉 ✕',closeModal)),el('div',{class:'modal-body'},body),notice);dialog.querySelector('h2').id='modal-title';if(!dialog.open)dialog.showModal();}
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
dialog.addEventListener('close',()=>{document.body.append(notice);if(activeShareURL){URL.revokeObjectURL(activeShareURL);activeShareURL=null;}});
function header(pre=false){return pre?el('header',{class:'topbar pretest-header'},el('div',{class:'brand'},'你擁有哪種隱藏身分？',text('small','A JOURNEY TO SHITOPIA'))):el('header',{class:'topbar'},el('div',{class:'brand'},'你擁有哪種隱藏身分？',text('small','A JOURNEY TO SHITOPIA')),el('div',{class:'top-actions'},button('收藏',()=>collection('endings')),screen==='game'?button('背包',()=>collection('items')):null,screen==='game'?button('知識',()=>collection('knowledge')):null,el('button',{type:'button','data-menu-anchor':true,onClick:action(menu)},'選單 ☰')));}
function footer(){return el('footer',{class:'footer'},'製作者：聞人旅（@klag_spear）｜遊戲進度儲存於目前瀏覽器');}
function shell(content,pre=false){disposeNoticeAnchor?.();const head=pre&&screen==='home'?null:header(pre);if(head&&!publicData&&screen==='game'&&game.run&&game.run.mode!=='ending'){head.classList.add('game-header');const row=el('div',{class:'header-ab'},...head.childNodes);head.replaceChildren(row,el('div',{class:'header-divider','aria-hidden':'true'}),hud());}app.replaceChildren(el('main',{class:'shell '+(pre?'pretest-shell':'posttest-shell')},head,content,footer(pre)));disposeNoticeAnchor=anchorNotices(notice,()=>app.querySelector('[data-menu-anchor]'));}
function title(eyebrow,heading,description){return el('div',{class:'page-title'},text('p',eyebrow,'eyebrow'),text('h2',heading),description?text('p',description,'muted'):null);}
function resetQuiz(){clearTimeout(flushTimer);flushing=false;game.run=null;game.checkpoints={option:null,event:null,adventure:null};game.quiz=null;screen='home';selectedTarget=null;publicData=null;history.replaceState(null,'',location.pathname+location.search);if(dialog.open)closeModal();persist();render();}
function home(){const input=el('input',{type:'text',id:'player-name',maxlength:30,placeholder:'留下你的名字',autocomplete:'nickname',value:game.quiz?.name||''});
 const start=()=>{if(!validName(input.value)){notify('請先輸入名字。');input.focus();return;}preloader.start();game.quiz=startQuiz(input.value);game.quiz.mode=selectedMode;screen='quiz';persist();render();};
 const realisticAvailable=REALISTIC_MODE_ENABLED&&game.meta.quizCompleted;
 const submit=el('button',{class:'primary',type:'submit',disabled:!validName(input.value)},'開始測驗　→');input.addEventListener('input',()=>{submit.disabled=!validName(input.value);});
 const form=el('form',{class:'home-form',onSubmit:e=>{e.preventDefault();action(start)();}},el('div',{class:'mode-select'},button((selectedMode==='normal'?'◉ ':'○ ')+'普通版本',()=>{selectedMode='normal';notify('已選擇普通版本');}),button(realisticAvailable?'寫實版本':'寫實版本 · 尚未開放',()=>{selectedMode='realistic';notify('已選擇寫實版本');},'',!realisticAvailable)),el('label',{for:'player-name',class:'form-label'},'你的名字'),input,submit);
 const copy=el('section',{class:'hero-copy'},text('p','PERSONALITY TEST / 八道情境考驗','eyebrow'),text('h1','你擁有哪種隱藏身分？'),text('p','A JOURNEY TO SHITOPIA','quiet-subtitle'),text('p','「情境考驗！測試你擁有哪種隱藏身分？」','tagline'),form);
 const root=el('div',{},el('div',{class:'hero'},copy),el('div',{class:'info-strip'},text('p','根據直覺與個人性格進行選擇，盡量減少外在干擾。'),text('p','測驗結果與當前狀態相關，並非固定，請酌情參考。'),text('p','結果僅作性格參考，並無考量生理狀態影響。')));if(PLAYTEST_MINIGAME_ENTRY_ENABLED)root.append(button('小遊戲測試',()=>{const host=el('section',{class:'qa-center'});shell(host,true);disposeMinigame=mountQaCenter(host,{onReturn:()=>{disposeMinigame?.();disposeMinigame=null;home();}});},'playtest-entry'));shell(root,true);
}
function quiz(){if(!game.quiz){screen='home';home();return;}const i=game.quiz.answers.length;if(i>=8){screen='result';result();return;}const q=catalog.quiz[i];shell(el('section',{class:'quiz-wrap'},text('p',`QUESTION ${String(i+1).padStart(2,'0')} / 08`,'eyebrow'),el('div',{class:'progress-line'},el('div',{class:'progress-fill',style:`width:${i/8*100}%`})),text('h2',q.text,'quiz-question'),el('div',{class:'quiz-options'},game.quiz.orders[i].map((id,j)=>{const o=q.options.find(o=>o.id===id);return button(el('span',{class:'row'},text('span',String(j+1).padStart(2,'0'),'option-index'),text('span',o.text)),()=>{game.quiz.answers.push(id);if(game.quiz.answers.length===8){game.meta.quizCompleted=true;game.meta.realisticUnlocked=true;screen='result';}persist();render();});})),text('p','沒有標準答案，選擇最接近此刻的你。','hint')),true);}
function result(data=null){const name=data?.name||game.quiz.name,winners=data?.winners||scoreQuiz(game.quiz).winners;
 if(!data)preloader.result(winners);
 const mode=data?.mode||game.quiz?.mode||'normal',cards=winners.map(id=>{const r=catalog.races[id],suffix=id.slice(4),visual=mode==='realistic'?'IMG-RES-REALISTIC-'+suffix:'IMG-RES-'+suffix;return el('article',{class:'result-card','data-race':id},el('div',{class:'result-visual'},el('div',{class:'result-mover'},imageElement(visual,'result-portrait')),imageElement('IMG-UI-TOILET','result-toilet')),el('div',{},text('p','YOUR HIDDEN IDENTITY','eyebrow'),text('h2',r.abbreviation+' — '+r.name),text('p',r.words,'result-words'),r.description.map(p=>text('p',p)),data?null:button('沖水',()=>flush(id),'primary')));});
 shell(el('section',{},data?text('p','這是分享者的公開結果，不會改變你的遊戲進度。','public-banner'):null,title('THE RESULT / 測驗結果',name+'，這就是你的隱藏身分',winners.length>1?'你有不只一種最高分身分。向下瀏覽，選擇想展開旅程的那一張結果卡。':'你的八個選擇，描繪出這樣的你。'),el('div',{class:'result-list'},cards),text('p','Playtest v0.6.3 · F2 解謎與 D4 追逐已實裝，卡牌小遊戲仍使用測試結果介面。','playtest-info'),el('div',{class:'row',style:'margin-top:24px'},button('分享測驗結果',()=>share({type:'quiz',name,winners,mode})),button(data?'開始自己的測驗':'重新測驗',resetQuiz))));}
function flush(race){if(flushing)return;const card=[...app.querySelectorAll('.result-card')].find(c=>c.dataset.race===race);if(!card)return;flushing=true;session.selectedRace=race;app.querySelectorAll('.result-card button').forEach(b=>b.disabled=true);positionFlush(card);card.classList.add('flushing');const blackout=el('div',{class:'result-blackout','aria-hidden':'true'});app.querySelector('main').append(blackout);clearTimeout(flushTimer);const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?FLUSH_TIMING.reducedDuration:FLUSH_TIMING.duration;flushTimer=setTimeout(()=>{flushing=false;screen='demon';persist();render();},delay);}
function demon(){app.replaceChildren(el('main',{class:'demon-screen'},el('section',{class:'demon-card'},text('p','IN THE DARK / EVT-TEST1','eyebrow'),text('h1',raw('NODE-TEST1-002')),el('div',{class:'stack'},['NONE','DRAGONFRUIT','CORN','ENOKI'].map((id,i)=>button(raw('OPT-TEST1-00'+(i+1)).replace(/ →.*$/,''),()=>{engine.start(game.quiz?.name||'旅人',session.selectedRace||'RAC-DRGN','DMN-'+id);screen='game';after();}))))),footer());}
function hud(){const r=game.run;return el('div',{class:'game-hud'},el('div',{class:'location-info'},text('small','THE KINGDOM / 自由探索','eyebrow'),text('h2',catalog.locations[r.location].name)),el('div',{class:'player-info'},text('strong',r.name,'player-name'),text('span',`${catalog.races[r.race].name}　${catalog.demons[r.demon].name}　${r.gg} GG`,'player-details')));}
function replacePlayer(s){return normalizeDisplayText(s).replaceAll('用戶名',game.run?.name||'旅人').replaceAll('{demon}',catalog.demons[game.run?.demon]?.name||'');}
function parseSpeech(s){return parseSourceSpeech(s,{name:game.run?.name||'旅人',demon:catalog.demons[game.run?.demon]?.name||''});}
function sceneFrame(content,cast={left:null,right:null,active:null}){return sharedSceneFrame(content,cast,game.run);}
function storyView(){const r=game.run,n=graph[r.node],current=n?.lines[r.line],speech=parseSpeech(storyLineText(current,r)),scope=r.event||[...r.history].reverse().find(h=>h.interaction)?.interaction||r.node;
 const cast=resolveCast(r.history,storyLineText(current,r),scope,parseSpeech);r.sceneCast={...cast,scope};
 let overlay;
 if(r.mode==='story')overlay=scenePanel('dialogue',dialogueHeader(speech.speaker?speech.name:null,button('繼續　▸',()=>{engine.advance();after(engine.run.mode!=='story');},'next')),text('div',speech.text,'dialogue-text'));
 else if(r.mode==='choice'){const options=graph[r.node].choices.filter(o=>visibleOption(o,r,game.meta));overlay=scenePanel('dialogue',text('div','你的選擇','speaker'),el('div',{class:'choices'},options.map(o=>{const locked=lockedProgression(o.condition,r,game.meta,o.id);return button(replacePlayer(o.text)+(locked?'　🔒':''),()=>{if(locked){notify(LOCKED_MESSAGE);return;}engine.choose(o.id);after();},locked?'locked-action':'');})));}
 else if(r.mode==='minigame'){const a=adapters[r.pending];overlay=scenePanel('debug-panel',text('h3','小遊戲結果模擬'),el('div',{},text('p','此小遊戲尚未實裝，本版本提供結果模擬以供完整流程測試。'),el('div',{class:'stack'},a.availableOutcomes.map(o=>button(o.label,()=>{engine.result(o.id);after();},'primary')))),a.canExit?[button('暫時離開',()=>{engine.result('exit');after();},'navigation-link')]:[]);}
 return el('section',{class:'game-screen'},sceneFrame(overlay,cast));
}
function explore(){const r=game.run,targets=visibleTargets(r.location,r),available=new Set(engine.available().map(o=>o.id));if(selectedTarget&&!targets.some(t=>t.id===selectedTarget)&&!(r.location==='LOC-012'&&selectedTarget==='bookshelf'))selectedTarget=null;
 const menuOptions=(interactions[r.location]||[]).filter(o=>visibleOption(o,r,game.meta)&&(available.has(o.id)||lockedProgression(o.condition,r,game.meta,o.id)));
 const optionsFor=id=>targetOptions(r.location,id,menuOptions,r,game.meta);
 const go=id=>{engine.move(id);selectedTarget=null;after();};
 const interact=o=>{if(lockedProgression(o.condition,r,game.meta,o.id)){notify(LOCKED_MESSAGE);return;}engine.interact(o.id);after();};
 const optionButton=o=>button(replacePlayer(o.text)+(lockedProgression(o.condition,r,game.meta,o.id)?'　🔒':''),()=>interact(o),'target-card'+(lockedProgression(o.condition,r,game.meta,o.id)?' locked-action':askedBefore(o,r)?' visited-action':''));
 const hub=hubFor(r.location);let overlay;
 if(isHub(r.location))overlay=scenePanel('explore-panel',text('p','DISTRICTS / 選擇場所','eyebrow'),el('div',{class:'target-grid'},engine.destinations().map(l=>button(catalog.locations[l.id].name,()=>go(l.id),'target-card'))));
 else if(selectedTarget){const target=targets.find(t=>t.id===selectedTarget),options=optionsFor(selectedTarget);overlay=scenePanel('explore-panel',text('h3',selectedTarget==='bookshelf'?'觀察旁邊的書櫃':target?.label||''),options.length?el('div',{class:'target-grid'},options.map(optionButton)):text('p','目前沒有新的線索。','muted'),[button('← 返回',()=>{selectedTarget=null;render();},'navigation-link')]);}
 else{const direct=directOptions(r.location,menuOptions);const onward=onwardDestinations(r.location,engine.destinations()).filter(l=>!(r.location==='LOC-002'&&l.id==='LOC-011'));
  overlay=scenePanel('explore-panel',text('p','EXPLORE / 場所互動','eyebrow'),el('div',{class:'target-grid'},targets.map(t=>button(t.label,()=>{if(t.id==='temple-interior'){go('LOC-011');return;}const options=optionsFor(t.id);if(options.length===1){interact(options[0]);return;}selectedTarget=t.id;render();},'target-card')),direct.map(o=>button(o.text,()=>{selectedTarget='bookshelf';if(r.seen.includes('library.shelf'))render();else interact(o);},'target-card')),onward.map(l=>button(catalog.locations[l.id].name,()=>go(l.id),'target-card'))),hub?[button('返回'+catalog.locations[hub].name,()=>{engine.returnHub();selectedTarget=null;after();},'navigation-link')]:[]);
 }
 return el('section',{class:'game-screen'},sceneFrame(overlay));
}
function shop(){const panel=scenePanel('explore-panel shop-panel',text('h3','懶散的商販'),el('div',{class:'shop-grid'},catalog.shop.map(p=>el('article',{class:'card'},text('h3',catalog.items[p.id].name),text('p',catalog.items[p.id].description),text('small',`持有 ${game.run.items[p.id]||0} · ${p.price} GG`),button(game.run.gg<p.price?'GG 不足':`購買 · ${p.price} GG`,()=>{engine.buy(p.id);after();notify('懶散的商販：「謝謝惠顧。結帳真麻煩……」');},'',game.run.gg<p.price)))),[button('返回商店街',()=>{engine.leave();selectedTarget=null;after();},'navigation-link')]);return el('section',{class:'game-screen'},sceneFrame(panel,{left:'NPC-014',right:null,active:'NPC-014'}));}
function ending(data=null){const id=data?.id||game.run.ending,e=catalog.endings[id],name=data?.name||game.run.name;
 const body=el('section',{class:'ending'},data?text('p','公開結局展示，不會解鎖你的收藏。','public-banner'):null,text('p','THE END / '+id,'eyebrow'),text('h1',e.name),endingVisual(id,name),el('div',{class:'row'},button('分享這個結局',()=>share({type:'ending',id,name}),'primary'),button('結局收藏',()=>collection('endings'))));
 if(data)body.append(button('開始自己的旅程',resetQuiz));else body.append(el('div',{class:'divider'}),text('p','故事可以結束，也可以從另一個選擇重新開始。','hint'),el('div',{class:'rewind-grid'},button('回到選項前',()=>rewind('option'),'',!game.checkpoints.option),button('回到事件前',()=>rewind('event'),'',!game.checkpoints.event),button('回到冒險開頭',()=>rewind('adventure')),button('回到心理測驗',resetQuiz)));body.append(el('section',{class:'ending-credits'},text('h2','感謝名單'),text('p','測試員：'+credits.testers.join('、'))));return body;
}
function rewind(kind){if(engine.rewind(kind)){screen='game';selectedTarget=null;closeModal();after();}}
function keepContinueVisible(){requestAnimationFrame(()=>fitScene(app.querySelector('.scene-frame'),app.querySelector('.footer'),app.querySelector('.shell')));}
function render(){disposeMinigame?.();disposeMinigame=null;if(publicData){if(publicData.type==='quiz'){result(publicData);return;}if(publicData.type==='ending'){shell(ending(publicData));return;}shell(el('section',{},title('SHARED COLLECTION / 公開收藏','旅人的收藏','此展示不會改變你的遊戲進度。'),collectionBody(publicData.type,publicData.ids),button('開始自己的旅程',resetQuiz)));return;}
 if(screen==='game'&&game.run?.mode==='minigame'&&formalMinigames[game.run.pending]){const host=el('section',{class:'game-screen'});shell(host);disposeMinigame=mountMinigame(game.run.pending,host,formalContext(engine,()=>persist(true),()=>after()));return;}
 if(screen==='home')home();else if(screen==='quiz')quiz();else if(screen==='result')result();else if(screen==='demon')demon();else if(screen==='game'&&game.run){shell(game.run.mode==='ending'?ending():game.run.mode==='explore'?explore():game.run.mode==='shop'?shop():storyView());keepContinueVisible();}else{screen='home';home();}}
window.addEventListener('resize',keepContinueVisible);
function collectionBody(type,sharedIds=null){const mapping={achievements:catalog.achievements,endings:catalog.endings,knowledge:catalog.knowledge,items:catalog.items},data=mapping[type];const ids=sharedIds||(type==='achievements'?game.meta.achievements:type==='endings'?game.meta.endings:type==='knowledge'?game.run?.knowledge||[]:Object.keys(game.run?.items||{}).filter(id=>game.run.items[id]>0));if(type==='items'){const owned=ownedItems(game.run);return el('div',{class:'collection backpack'},owned.length?owned.map(item=>el('article',{class:'card'},text('h3',item.name),text('p',item.description),text('small','持有數量：'+item.count))):text('p','背包目前是空的。','muted'));}
 return el('div',{class:'collection'},text('p',`已取得 ${ids.length} / ${Object.keys(data).length}`,'eyebrow'),Object.values(data).map(r=>{const unlocked=ids.includes(r.id);return el('article',{class:'card '+(unlocked?'':'locked')},text('small',r.id+' · '+(unlocked?'已取得':'未取得')),text('h3',unlocked?r.name:(type==='knowledge'||type==='items'?'尚未取得':'？？？')),text('p',unlocked?(r.description+(type==='items'?`\n持有數量：${game.run.items[r.id]}`:'')):(type==='endings'?r.hint:'尚未解鎖')),unlocked&&type==='endings'?text('p','條件：'+r.condition,'hint'):null); }));}
function collection(type){const names={achievements:'成就收藏',endings:'結局收藏',knowledge:'當周目知識',items:'背包'};const b=el('div',{},collectionBody(type));if(['achievements','endings'].includes(type))b.prepend(el('div',{class:'row',style:'margin-bottom:18px'},button('分享收藏',()=>share({type,ids:[...game.meta[type]],name:game.run?.name||game.quiz?.name||'旅人'}))));modal(names[type],b);}
function saveMenu(){const root=el('div',{class:'collection'});for(let i=1;i<=5;i++){let d,error;try{d=saves.peek(i);}catch(e){error=e.message;}const info=d?`${d.run.name} · ${catalog.races[d.run.race]?.name||d.run.race}\n${catalog.locations[d.run.location]?.name||d.run.location}${d.run.event?' / '+d.run.event:''}\n${new Date(d.savedAt).toLocaleString('zh-TW')}`:error||'尚無資料';root.append(el('div',{class:'card save-slot'},el('div',{},text('h3','存檔 '+i),text('p',info)),el('div',{class:'row'},button(d?'覆寫':'儲存',()=>{if(d)confirmBox('覆寫此存檔？','其他存檔及永久收藏不受影響。',()=>{saves.save(i,game);saveMenu();});else{saves.save(i,game);saveMenu();}},'',!game.run),button('讀取',()=>loadSave(i),'',!d),button('刪除',()=>confirmBox('刪除此存檔？','此動作只刪除這個欄位。',()=>{saves.delete(i);saveMenu();}),'',!d&&!error))));}
 let auto;try{auto=saves.peek('auto');}catch(e){root.append(text('p',e.message));}root.append(el('div',{class:'card'},text('h3','自動存檔'),text('p',auto?`${auto.run.name} · ${new Date(auto.savedAt).toLocaleString('zh-TW')}`:'尚無資料'),button('讀取自動存檔',()=>loadSave('auto'),'',!auto)));modal('存檔與讀檔',root);}
function confirmBox(heading,message,yes){modal(heading,el('div',{},text('p',message),el('div',{class:'row'},button('確認',yes,'danger'),button('取消',menu))));}
function showWalkthrough(){const show=()=>modal('簡易版主線攻略',el('ol',{},walkthrough.map(step=>text('li',step))));if(saves.read('walkthroughAcknowledged')){show();return;}modal('劇情提示',el('div',{},text('p',spoilerWarning),el('div',{class:'row'},button('返回',menu),button('顯示攻略',()=>{saves.write('walkthroughAcknowledged',true);show();},'primary'))));}
function settingsMenu(){const range=el('input',{type:'range',min:0,max:100,value:Math.round(settings.volume*100),'aria-label':'主音量',onInput:e=>{settings.volume=Number(e.target.value)/100;saves.write('settings',settings);}});modal('音效設定',el('div',{class:'stack'},text('p','目前使用簡單的 UI 提示音，正式音效素材尚待補齊。'),el('label',{},'主音量 ',range),button(settings.mute?'取消靜音':'靜音',()=>{settings.mute=!settings.mute;saves.write('settings',settings);settingsMenu();})));}
function menu(){modal('旅人選單',el('div',{class:'modal-grid'},button('繼續',closeModal,'primary'),button('存檔／讀檔',saveMenu),button('背包',()=>collection('items')),button('知識',()=>collection('knowledge')),button('成就',()=>collection('achievements')),button('結局',()=>collection('endings')),button('音效／音量',settingsMenu),button('回到心理測驗',()=>confirmBox('回到心理測驗？','清除目前周目，保留手動存檔及永久收藏。',resetQuiz)),button('完全重置遊戲',()=>confirmBox('完全重置遊戲？','將清除五個存檔、自動存檔、當前周目、永久收藏與設定。此操作無法復原。',()=>{saves.reset();Object.assign(game,createGame());settings.volume=.35;settings.mute=false;session={};resetQuiz();notify('遊戲資料已完全重置。');}),'danger'),button('簡易版主線攻略',showWalkthrough,'walkthrough-link')));}
function shareReward(type){if(['ending','endings','achievements'].includes(type)){grant(game.meta,'ACH-19',game.notices);persist();}}
async function share(data){const value=shareText(data),url=shareURL(data),blob=await makeImage(data),body=el('div',{class:'stack'});activeShareURL=URL.createObjectURL(blob);body.append(el('img',{src:activeShareURL,alt:'分享圖片預覽',class:'share-preview'}),el('textarea',{readonly:true,rows:5,'aria-label':'分享文字',style:'width:100%;font:inherit;padding:12px'},value+'\n'+url));
 body.append(button('複製分享文字',async()=>{await copyText(value+'\n'+url);shareReward(data.type);notify('已複製分享文字。');}),button('複製結果網址',async()=>{await copyText(url);shareReward(data.type);notify('已複製公開結果網址。');}),button('儲存分享圖片',()=>{download(blob);notify('已產生可儲存圖片。');}));
 if(navigator.clipboard?.write&&window.ClipboardItem)body.append(button('複製分享圖片',async()=>{try{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);shareReward(data.type);notify('已複製圖片。');}catch{download(blob);notify('瀏覽器未允許圖片複製，已改為下載。');}}));
 if(navigator.share)body.append(button('開啟系統分享',async()=>{try{await navigator.share({title:'你的隱藏身分',text:value,url});shareReward(data.type);}catch(e){if(e.name!=='AbortError')notify('系統分享不可用，請使用複製或儲存圖片。');}}));modal('分享這段旅程',body);}
window.addEventListener('hashchange',()=>{publicData=decodePublic(location.hash);render();});
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.matches('input,textarea'))return;if(e.key==='Escape'&&['result','game'].includes(screen)){menu();}else if((e.key===' '||e.key==='Enter')&&screen==='game'&&game.run?.mode==='story'&&e.target===document.body){e.preventDefault();action(()=>{engine.advance();after(engine.run.mode!=='story');})();}});
render();

