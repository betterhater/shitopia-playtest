export const DRAIN={x:.50,y:.415};
export const FLUSH_TIMING={duration:2100,reducedDuration:380,waterAt:.65,drainAt:.9,blackoutAt:.8};
export function flushTarget(toilet,portrait,drain=DRAIN){
 const x=toilet.left+toilet.width*drain.x,y=toilet.top+toilet.height*drain.y;
 return {x,y,dx:x-(portrait.left+portrait.width/2),dy:y-(portrait.top+portrait.height/2)};
}
export function positionFlush(card){
 const image=card.querySelector('.result-toilet img'),portrait=card.querySelector('.result-mover');
 const visual=card.querySelector('.result-visual'),style=getComputedStyle(visual);
 const drain={x:parseFloat(style.getPropertyValue('--flush-drain-x'))/100||DRAIN.x,y:parseFloat(style.getPropertyValue('--flush-drain-y'))/100||DRAIN.y};
 const target=flushTarget((image||visual).getBoundingClientRect(),portrait.getBoundingClientRect(),drain);
 visual.style.setProperty('--flush-dx',target.dx+'px');visual.style.setProperty('--flush-dy',target.dy+'px');return target;
}
