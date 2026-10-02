import {isCompactChoiceSet} from './choice-layout.js';
export function sceneGeometry(width,height,documentTop,footerHeight){
 const visual=Math.max(180,height-documentTop-footerHeight-8);
 return {width:Math.min(width-24,visual),visual,dialogueTop:visual*.7,safe:footerHeight+24};
}
export function fitScene(frame,footer,shell){
 if(!frame||!footer)return;
 const g=sceneGeometry(innerWidth,innerHeight,frame.getBoundingClientRect().top+scrollY,footer.getBoundingClientRect().height);
 shell?.style.setProperty('--footer-height',g.safe+'px');shell?.style.setProperty('--game-width',Math.min(innerWidth,innerHeight)+'px');
 frame.style.setProperty('--visual-stage-height',g.visual+'px');frame.style.setProperty('--dialogue-top',g.dialogueTop+'px');frame.style.maxWidth=g.width+'px';
 for(const choices of frame.querySelectorAll('.choices'))choices.classList.toggle('compact',isCompactChoiceSet([...choices.children].map(b=>b.textContent),choices.getBoundingClientRect().width));
}
