import {el,text} from '../../ui/dom.js';
import {minigameAssets as assets,assetURL} from '../assets.js';
import {art,gameButton} from '../shared/view.js';
import {freshRunner,stepRunner,moveLane,tapLane,rowY,phaseFor,keyDirection,isInvincible} from './model.js';
import {hazardElement,laneCenter} from './hazard-view.js';
export function mountRunner(host,{onResult,onExit,random=Math.random}){
 const a=assets.runner,s=freshRunner();let raf,last=null,disposed=false,finished=false,resultDialog=null;

 const stage=el('div',{class:'runner-stage',tabindex:0,'aria-label':'三線跑道，使用左右方向鍵或 A、D 切換相鄰路線'}),tiles=el('div',{class:'runner-road'});
 for(let i=0;i<3;i++)tiles.append(el('div',{class:'road-tile',style:`background-image:url("${assetURL(a.road)}")`}));
 const player=art(a.playerRun1,'奔跑中的主角','runner-player'),crowd=el('div',{class:'runner-crowd','aria-hidden':'true'},art(a.chaserCrowd,'','crowd-art')),entities=el('div',{class:'runner-entities'});
 stage.append(tiles,entities,player,crowd,...['左側跑道','中央跑道','右側跑道'].map((name,i)=>gameButton('',()=>tapLane(s,i),{class:'runner-lane',style:`left:${i*100/3}%;`,'aria-label':name})));
 const root=el('section',{class:'formal-minigame runner plaid-sides'},stage);host.append(root);
 const fitStage=()=>{if(!root.isConnected)return;const footer=document.querySelector('.footer');const bottom=footer?footer.getBoundingClientRect().top:innerHeight;stage.style.height=Math.max(280,bottom-stage.getBoundingClientRect().top-8)+'px';};const observer=new ResizeObserver(fitStage);observer.observe(host);window.addEventListener('resize',fitStage);requestAnimationFrame(fitStage);
 const nodes=new Map();let previousFrame=-1;
 function draw(){stage.dataset.progress=s.progress.toFixed(2);stage.dataset.row=String(s.row);stage.dataset.lane=String(s.lane);player.style.left=`${(s.visualLane+.5)*100/3}%`;player.style.top=`${rowY(s.visualRow)*100}%`;
  const frame=Math.floor(s.time*8*phaseFor(s.progress).speed)%2;if(frame!==previousFrame){player.src=assetURL(frame?a.playerRun2:a.playerRun1);player.style.transform=`translate(-50%,-${(frame?475:479)/512*100}%)`;previousFrame=frame;}
  player.classList.toggle('invincible',isInvincible(s));stage.dataset.invincible=String(isInvincible(s));player.style.opacity=isInvincible(s)?String(.45+.55*Math.abs(Math.sin(s.time*16))):'1';
  tiles.style.transform=`translateY(${s.visualDistance%1*100/3}%)`;
  const live=new Set(s.entities.map(e=>e.id));for(const [id,node]of nodes)if(!live.has(id)){node.remove();nodes.delete(id);}
  for(const e of s.entities){let node=nodes.get(e.id);if(!node){node=hazardElement(e,a[e.type]);nodes.set(e.id,node);entities.append(node);}node.style.left=`${laneCenter(e.lane)}%`;node.style.top=`${e.y*100}%`;}
 }
 function showResult(){finished=true;if(s.result==='SUCCESS'){resultDialog=el('dialog',{class:'runner-success','aria-label':'祭品就在眼前了！'},text('p','祭品就在眼前了！'),gameButton('繼續',()=>{resultDialog.close();onResult('SUCCESS');},{class:'primary'}));resultDialog.addEventListener('cancel',e=>e.preventDefault());root.append(resultDialog);resultDialog.showModal();}else root.append(gameButton('繼續',()=>onResult('FAIL'),{class:'runner-result primary'}));}
 function tick(now){if(disposed)return;const delta=last===null?0:(now-last)/1000;last=now;if(!document.hidden&&!document.querySelector('dialog[open]'))stepRunner(s,delta,random);draw();if(s.result){if(!finished)showResult();return;}raf=requestAnimationFrame(tick);}
 const key=e=>{if(!root.isConnected||e.target.matches('input,textarea')||document.querySelector('dialog[open]'))return;const direction=keyDirection(e.key);if(direction){e.preventDefault();moveLane(s,direction);}};
 const visibility=()=>{last=null;};window.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);raf=requestAnimationFrame(tick);
 return ()=>{disposed=true;observer.disconnect();window.removeEventListener('resize',fitStage);cancelAnimationFrame(raf);resultDialog?.remove();window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);root.remove();};
}
