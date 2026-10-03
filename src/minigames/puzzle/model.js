import {investigations,storyText,inferences} from './data.js';
import {catalog} from '../../data/catalog.js';
export const freshPuzzle=()=>({version:1,investigated:{},items:[],clues:[],crossed:[],selected:null,inference:null,diaryUnlocked:false,diaryRead:false,diaryPage:0,boxUnlocked:false,boxViewed:false,animalsLured:false,underbedAfterLureSeen:false,boxRetrieved:false,storyRead:false,intro:0,viewer:null,dialogue:null,report:null});
export function ensurePuzzle(run){run.minigames??={};return run.minigames['GAME-F2']??=freshPuzzle();}
const own=(s,id)=>{if(!s.items.includes(id))s.items.push(id);};
const remove=(s,id)=>{s.items=s.items.filter(x=>x!==id);};
export function discoverClues(s){const i=s.investigated;const conditions=[i.wardrobe&&i.desk,s.boxUnlocked,i.body,s.items.includes('shovel')&&i.shoes&&i.feet,i.head,s.boxRetrieved,(i.desk||0)>=2,s.storyRead,s.boxUnlocked,i.feet&&i.body,s.diaryRead,s.diaryRead&&s.boxViewed,s.diaryRead&&s.boxViewed];const added=[];conditions.forEach((yes,j)=>{const id=j+1;if(yes&&!s.clues.includes(id)){s.clues.push(id);added.push(id);}});return added;}
// Completed-use evidence remains owned and viewable in the notebook archive.
// Only its interactive shelf lifetime ends; no plot item is discarded.
export function inventorySlots(s){return ['notebook',...s.items.filter(id=>!(id==='story'&&s.storyRead)&&!(id==='shovel'&&s.boxRetrieved)&&!(['noteTop','noteBottom'].includes(id)&&s.diaryUnlocked))];}
export function legalHotspotUse(id,s,item){return id==='underbed'&&s.items.includes(item)&&((item==='bowl'&&!s.animalsLured)||(item==='shovel'&&!s.boxRetrieved));}
export function isHotspotInteractive(id,s,selectedItem=s.selected){if(!investigations[id])return false;const remaining=id==='underbed'?!s.boxRetrieved:(s.investigated[id]||0)<investigations[id].length;return remaining||legalHotspotUse(id,s,selectedItem)||s.items.some(item=>legalHotspotUse(id,s,item));}
export function inspect(s,id){if(s.selected){const item=s.selected;s.selected=null;return use(s,item,id);}if(!isHotspotInteractive(id,s))return '';
 if(id==='underbed'){s.investigated[id]=1;if(s.animalsLured){s.underbedAfterLureSeen=true;return '搆不到，但能微微觸碰到冰冷的質地。';}return investigations[id][0];}
 const count=s.investigated[id]||0;s.investigated[id]=Math.min(2,count+1);
 if(id==='wardrobe'&&count>=1)own(s,'shovel');if(id==='desk'&&count>=1)own(s,'story');if(id==='bed'&&count>=1)own(s,s.diaryUnlocked?'diaryOpen':'diary');if(id==='body'&&!s.animalsLured)own(s,'bowl');
 return investigations[id][Math.min(count,investigations[id].length-1)];
}
export function use(s,item,target){
 if(item==='bowl'&&target==='underbed'&&legalHotspotUse(target,s,item)){s.animalsLured=true;remove(s,'bowl');return '小動物對木碗裡的殘渣很有興趣，一擁而上。';}
 if(item==='shovel'&&target==='underbed'&&legalHotspotUse(target,s,item)){if(!s.animalsLured)return '太多小動物在爬了，光是趴下都很噁心。';s.boxRetrieved=true;own(s,s.boxUnlocked?'boxOpen':'box');return '用鏟子把深處的物品取出。是一個上鎖的木盒，上面壓著一柄沉重的石劍，讓木盒有點開裂。';}
 if(((item==='key'&&target==='box')||(item==='box'&&target==='key'))&&s.items.includes('key')&&s.items.includes('box')){remove(s,'key');remove(s,'box');own(s,'boxOpen');s.boxUnlocked=true;return '木盒子打開了，裡頭有一副大屎決鬥的遊戲牌組和一塊獸骨。';}
 return '';
}
export function openItem(s,id){s.selected=null;
 if(id==='story'){s.storyRead=true;own(s,'noteTop');own(s,'noteBottom');return {type:'story',text:storyText};}
 if(id==='diary')return {type:'password'};
 if(id==='diaryOpen'){s.diaryRead=true;return {type:'diary'};}
 if(id==='boxOpen'){s.boxViewed=true;return {type:'item',id,text:'裡頭有一副大屎決鬥的遊戲牌組和一塊獸骨。'};}
 return {type:id==='notebook'?'notebook':['noteTop','noteBottom'].includes(id)?id:'item',id};
}
export function clickItem(s,id){if(id!=='notebook'&&!s.items.includes(id))return null;if(s.selected===id){s.viewer=openItem(s,id);return s.viewer;}if(s.selected){const item=s.selected;s.selected=null;const message=use(s,item,id);if(message)s.dialogue={speaker:'player',text:message};return null;}s.selected=id;return null;}
export function unlockDiary(s,password){if(String(password)!==catalog.minigameRules.F2.password)return '鎖頭紋絲不動。';if(!s.diaryUnlocked){s.diaryUnlocked=true;remove(s,'diary');own(s,'diaryOpen');own(s,'key');}return '日記解開了，夾頁中掉出了一把小鑰匙。';}
export function availableInferences(s){return inferences.filter(r=>r.clues.every(id=>s.clues.includes(id)));}
export function toggleInference(s,id){if(!availableInferences(s).some(r=>r.id===id))return false;if(s.inference===id)s.inference=null;else if(s.inference===null)s.inference=id;else return false;return true;}
export function toggleClue(s,id){if(!s.clues.includes(id))return;s.crossed=s.crossed.includes(id)?s.crossed.filter(x=>x!==id):[...s.crossed,id];}
export function reportInference(s){if(!availableInferences(s).some(r=>r.id===s.inference))return null;return s.inference===1?'RETRY':s.inference===2?'NORMAL':'TRUE';}
