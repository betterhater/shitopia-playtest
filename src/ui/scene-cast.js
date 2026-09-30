// Pure slot selection: rebuilds the same stage from story history after save/load.
export function resolveCast(history,current,scope,parseSpeaker,playerParticipates=false,future=[]){
 const boundary=history.findLastIndex(h=>h.event===scope||h.interaction===scope);
 const segment=boundary>=0?history.slice(boundary+1):[];
 const appeared=[];
 for(const line of [...segment.map(h=>h.text).filter(Boolean),current].filter(Boolean)){
  const id=parseSpeaker(line).speaker;
  if(id&&!appeared.includes(id))appeared.push(id);
 }
 const active=current?parseSpeaker(current).speaker:null;
 if(!appeared.length)return {left:null,right:null,active};
 const playerSeen=appeared.includes('NPC-001');
 if(playerSeen){
  const candidates=appeared.filter(id=>id!=='NPC-001');
  return {left:playerSeen?'NPC-001':null,right:active&&active!=='NPC-001'?active:candidates.at(-1)||null,active};
 }
 let left=appeared[0],right=appeared[1]||null;
 for(const id of appeared.slice(2)){
  if(id===left||id===right)continue;
  const nextLeft=future.indexOf(left),nextRight=future.indexOf(right);
  if(nextLeft<0||(nextRight>=0&&nextLeft>nextRight))left=id;else right=id;
 }
 if(active&&!([left,right].includes(active)))right=active;
 return {left,right,active};
}
export function advanceCast(previous,current,scope,parseSpeaker,playerParticipates=false,future=[]){
 const cast=previous?.scope===scope?{...previous}:{scope,left:null,right:null,active:null};
 const id=current?parseSpeaker(current).speaker:null;
 cast.active=id;
 if(!id)return cast;
 if(id==='NPC-001'){
  if(cast.left&&cast.left!==id){
   if(!cast.right)cast.right=cast.left;
   else{const leftNext=future.indexOf(cast.left),rightNext=future.indexOf(cast.right);
    if(leftNext>=0&&(rightNext<0||leftNext<rightNext))cast.right=cast.left;}
  }
  cast.left=id;if(cast.right===id)cast.right=null;return cast;
 }
 if(cast.left==='NPC-001'){
  if(cast.left===id)cast.left=null;
  cast.right=id;return cast;
 }
 if(cast.left===id||cast.right===id)return cast;
 if(!cast.left){cast.left=id;return cast;}
 if(!cast.right){cast.right=id;return cast;}
 const leftNext=future.indexOf(cast.left),rightNext=future.indexOf(cast.right);
 if(leftNext<0||(rightNext>=0&&leftNext>rightNext))cast.left=id;else cast.right=id;
 return cast;
}
