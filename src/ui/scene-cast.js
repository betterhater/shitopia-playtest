// Reconstruct from displayed story beats, never from renders or elapsed time.
// Choices/results count too; automatic zero-line routing is not a visible beat.
export function castBeats(history,current,scope,parseSpeaker){
 const boundary=history.findLastIndex(h=>h.event===scope||h.interaction===scope);
 const segment=boundary>=0?history.slice(boundary+1):history;
 const beats=segment.filter(h=>h.text||h.option||h.result).map(h=>h.text?parseSpeaker(h.text).speaker:null);
 if(current)beats.push(parseSpeaker(current).speaker);
 return beats;
}
export function silentProgressCount(beats,id){const last=beats.lastIndexOf(id);return last<0?Infinity:beats.length-1-last;}
export function recentCastCandidates(beats){return [...new Set(beats.filter(Boolean))].filter(id=>silentProgressCount(beats,id)<2);}
export function resolveCast(history,current,scope,parseSpeaker){
 const beats=castBeats(history,current,scope,parseSpeaker),last=new Map();let left=null,right=null;
 for(let i=0;i<beats.length;i++){
  const id=beats[i];if(id)last.set(id,i);
  if(left&&i-last.get(left)>=2)left=null;if(right&&i-last.get(right)>=2)right=null;
  if(!id||id===left||id===right)continue;
  // A lone player starts on the right, leaving the first NPC's stable left
  // slot intact: player -> NPC-A -> NPC-B becomes A-left/B-right.
  if(id==='NPC-001'&&!right)right=id;else if(!left)left=id;else if(!right)right=id;
  else if(last.get(left)<=last.get(right))left=id;else right=id;
 }
 return {left,right,active:current?parseSpeaker(current).speaker:null};
}
// Compatibility: history must be supplied; previous renders never age the cast.
export function advanceCast(previous,current,scope,parseSpeaker,_participates=false,_future=[],history=[]){
 return {...resolveCast(history,current,scope,parseSpeaker),scope};
}
