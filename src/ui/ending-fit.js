// Measurement is injected so fitting is deterministic and independently testable.
export function fitEndingTextToBox({width,height,measure,normal=16,step=.25}){
 if(width<=0||height<=0)return normal;
 for(let size=normal;size>.5;size=Math.max(.5,size-step))if(measure(size,width)<=height)return size;
 return .5;
}
export function observeEndingText(panel){
 if(typeof requestAnimationFrame!=='function'||!panel.querySelector)return;
 const paragraph=panel.querySelector('.ending-story');let running=false;
 const fit=()=>{if(running||!panel.isConnected)return;running=true;
  const css=getComputedStyle(panel),width=panel.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight),height=panel.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  const size=fitEndingTextToBox({width,height,measure:s=>{paragraph.style.fontSize=s+'px';return paragraph.scrollHeight;}});
  paragraph.style.fontSize=size+'px';panel.dataset.fittedFont=String(size);running=false;
 };
 requestAnimationFrame(fit);
 if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(()=>{if(!panel.isConnected){observer.disconnect();return;}fit();});observer.observe(panel);}else window.addEventListener('resize',fit);
 document.fonts?.ready.then(fit);
}
