// Shared Cards / D4 transition. Disposal cancels every timer and never sends a result.
export function runFailureTransition(root,onResult,{holdMs=1000,fadeMs=1100,schedule=setTimeout,cancel=clearTimeout}={}){
 let disposed=false,sent=false;const timers=[];
 root.dataset.resultLocked='true';root.classList.add('minigame-failed');root.style.setProperty('--failure-fade-ms',fadeMs+'ms');
 const later=(fn,ms)=>timers.push(schedule(()=>{if(!disposed)fn();},ms));
 later(()=>{root.classList.add('failure-fading');later(()=>{if(!sent){sent=true;onResult('FAIL');}},fadeMs);},holdMs);
 return ()=>{disposed=true;for(const id of timers)cancel(id);};
}
