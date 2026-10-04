import {el,text} from '../../ui/dom.js';
import {cards} from './data.js';
import {currentAtk} from './model.js';
import {cardAssetURL} from './assets.js';
import {cardDisplayText} from './display-text.js';
export function artFor(id,cls=''){const url=cardAssetURL(id);return url?el('img',{src:url,alt:'',class:cls,draggable:'false'}):el('div',{class:'card-art-fallback '+cls},text('strong',id),text('span',cards[id]?.nameZh||id),text('small','圖像待提供'));}
export function cardFace(card,{thumbnail=false}={}){
 const d=cards[card.cardId||card],instance=typeof card==='object'?card:null;
 const face=el('div',{class:`card-face ${d.frameType==='EFFECT'?'effect-face':'monster-face'} ${thumbnail?'card-thumbnail':''}`,'data-card-id':d.cardId,'data-frame':d.frameType});
 face.append(artFor('FRAME_'+d.frameType,'card-frame'),text('div',d.nameZh,'card-name'),el('div',{class:'card-art'},artFor(d.cardId)),text('div',cardDisplayText[d.cardId],'card-effect'));
 if(d.type==='LM'||d.type==='UM')for(const [kind,value]of [['atk',instance?.lane?currentAtk(instance):d.baseAtk],['shield',instance?.shield||0],['hp',instance?.currentHp??d.baseHp]])face.append(text('span',String(value),'card-stat card-'+kind));
 else if(d.type==='SP')face.append(text('span','手牌素材 · 不可打出','card-material'));
 return face;
}
export function fullCardDialog(card,onClose){const d=cards[card.cardId||card],face=cardFace(card),dialog=el('dialog',{class:'cards-full-view','aria-label':d.nameZh},face,text('p',cardDisplayText[d.cardId],'card-full-wording'),text('small','單點關閉；Esc 也可關閉。'));
 const fit=()=>{const region=face.querySelector('.card-effect');region.style.fontSize='14px';region.style.lineHeight='1.3';};
 const observer=new ResizeObserver(fit);observer.observe(face);requestAnimationFrame(fit);dialog.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{observer.disconnect();dialog.remove();onClose?.();});return dialog;}
