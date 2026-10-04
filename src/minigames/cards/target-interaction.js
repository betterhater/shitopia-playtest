import {units,findUnit,clearUIPending} from './model.js';
import {cards} from './data.js';
// Refresh serialized interaction choices without changing ability rules/timing.
export function refreshPendingTargets(s){
 const p=s.pending;if(p?.kind!=='TARGET')return false;
 if(!p.targetSource){const trigger=[...s.log].reverse().find(e=>['ABILITY','DEATHRATTLE'].includes(e.type));
  if(trigger?.type==='ABILITY'&&trigger.cardId==='LM002'&&p.task.op==='MODIFIER'&&p.task.modifier?.atk===2)p.targetSource=trigger.unit;
 }
 const source=p.targetSource?findUnit(s,p.targetSource):null;
 const legal=p.targetSource?(source?units(s,source.controller).filter(u=>u.instanceId!==source.instanceId&&u.currentHp>0).map(u=>({value:u.instanceId,label:`${u.controller==='player'?'我方':'敵方'} ${u.lane} · ${cards[u.cardId].nameZh}`})):[]):p.options.filter(o=>{const u=findUnit(s,o.value);return u&&u.currentHp>0;});
 const changed=JSON.stringify(legal)!==JSON.stringify(p.options);p.options=legal;
 if(!legal.length){s.pending=null;clearUIPending(s);return true;}
 s.ui.pendingTarget=legal.map(o=>o.value);return changed;
}
