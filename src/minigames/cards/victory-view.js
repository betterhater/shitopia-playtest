import {el,text} from '../../ui/dom.js';
import {gameButton} from '../shared/view.js';
import {cardAssetURL} from './assets.js';
import {SPECIAL_WIN_DARK_EXODIA} from './data.js';
import {TRANSITION} from './rules.js';
export function showCardsVictory(root,s,onResult,config=TRANSITION,returnLabel='返回測試結果'){let sent=false,disposed=false,timer=null;
 const layer=el('div',{class:'cards-victory-layer','aria-live':'polite'});root.append(layer);
 const prompt=()=>{if(disposed)return;layer.classList.add('victory-ready');layer.append(text('h2','！勝利！'),gameButton(returnLabel,()=>{if(!sent){sent=true;onResult('SUCCESS');}},{class:'primary'}));};
 if(s.winReason===SPECIAL_WIN_DARK_EXODIA){layer.classList.add('dark-special');for(const key of ['darken','entrance','blur'])layer.style.setProperty('--special-'+key+'-ms',config[key+'Ms']+'ms');layer.style.setProperty('--special-shake-cycle-ms',config.shakeCycleMs+'ms');layer.style.setProperty('--special-shake-duration-ms',config.entranceMs+'ms');layer.style.setProperty('--special-shake-px',config.shakePx+'px');layer.style.setProperty('--special-blur-px',config.blurPx+'px');const image=el('img',{src:cardAssetURL('DARK_SPECIAL_FULL'),alt:'黑暗大法屎',class:'dark-special-art'});layer.append(image);timer=setTimeout(()=>{if(disposed)return;layer.classList.add('victory-blurring');timer=setTimeout(prompt,config.blurMs);},config.darkenMs+config.entranceMs);}else prompt();
 return ()=>{disposed=true;clearTimeout(timer);layer.remove();};
}
