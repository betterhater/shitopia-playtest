// Pointer gestures change presentation only; original fan geometry stays fixed.
export const INTERACTION_CONFIG={longPressMs:416,dragThresholdPx:9,gesture:'DIRECT_BOARD_TARGET'};
export const POINTER_STATES={IDLE:'IDLE',PRESS_PENDING:'PRESS_PENDING',DRAGGING:'DRAGGING',LONG_PRESS_OPEN:'LONG_PRESS_OPEN'};
export function bindCardPointer(node,{canDrag=false,canInteract=()=>true,onInspect,onValidate,onTap,onDragChange=()=>{},onPressChange=()=>{},zone,config=INTERACTION_CONFIG}={}){
 let start=null,timer=null,inspected=false,dragging=false,ghost=null;
 const hand=node.closest('.cards-hand');
 const set=state=>{node.dataset.pointerState=state;hand?.classList.toggle('cards-hand--pressing',state===POINTER_STATES.PRESS_PENDING);hand?.classList.toggle('cards-hand--longpress',state===POINTER_STATES.LONG_PRESS_OPEN);onPressChange(state!==POINTER_STATES.IDLE);};
 const clean=()=>{clearTimeout(timer);timer=null;if(ghost)onDragChange(false);ghost?.remove();ghost=null;node.classList.remove('card-dragging');};
 const down=e=>{if(e.button!==0||!canInteract())return;node.dataset.pointerType=e.pointerType;node.dataset.pointerPhase='down';start={id:e.pointerId,x:e.clientX,y:e.clientY};inspected=false;dragging=false;hand?.querySelectorAll('.cards-hand-card').forEach(c=>c.style.setProperty('--press-z',getComputedStyle(c).zIndex));set(POINTER_STATES.PRESS_PENDING);if(e.isTrusted)node.setPointerCapture?.(e.pointerId);timer=setTimeout(()=>{if(start&&!dragging){inspected=true;set(POINTER_STATES.LONG_PRESS_OPEN);node.dataset.pointerPhase='inspect';onInspect();}},config.longPressMs);};
 const move=e=>{if(!start||e.pointerId!==start.id||inspected)return;const distance=Math.hypot(e.clientX-start.x,e.clientY-start.y);if(distance>config.dragThresholdPx){clearTimeout(timer);if(!dragging){dragging=true;set(POINTER_STATES.DRAGGING);}if(canDrag&&!ghost){onDragChange(true);ghost=node.cloneNode(true);ghost.classList.add('card-drag-ghost');ghost.style.width=node.getBoundingClientRect().width+'px';document.body.append(ghost);node.classList.add('card-dragging');}}
  if(dragging){node.dataset.pointerPhase='drag';e.preventDefault();if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}}
 };
 const up=e=>{if(!start||e.pointerId!==start.id)return;const wasInspect=inspected,wasDrag=dragging;const r=zone?.getBoundingClientRect(),inside=r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;node.dataset.pointerPhase=wasDrag&&inside?'validated':'up';start=null;clean();set(POINTER_STATES.IDLE);if(wasDrag&&inside&&canDrag)onValidate({x:e.clientX,y:e.clientY,drag:true});else if(!wasInspect&&!wasDrag)(onTap||onValidate)?.();};
 const cancel=()=>{node.dataset.pointerPhase='cancel';start=null;clean();set(POINTER_STATES.IDLE);};const click=e=>{e.preventDefault();if(inspected){e.stopPropagation();inspected=false;}};
 const key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();(onTap|| (canDrag?onValidate:onInspect))?.();}else if(e.key==='i'){e.preventDefault();onInspect();}};
 node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',cancel);node.addEventListener('click',click);node.addEventListener('keydown',key);
 return ()=>{cancel();node.removeEventListener('pointerdown',down);node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',cancel);node.removeEventListener('click',click);node.removeEventListener('keydown',key);};
}
