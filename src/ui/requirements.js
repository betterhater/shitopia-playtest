import {catalog} from '../data/catalog.js';
import {check} from '../engine/conditions.js';

export const LOCKED_MESSAGE='缺少必要知識、道具或金錢';
export function publicRequirement(condition){
 if(Array.isArray(condition))return condition.length>0&&condition.every(publicRequirement);
 if(!condition||typeof condition!=='object')return false;
 if(condition.any)return condition.any.length>0&&condition.any.every(publicRequirement);
 if(condition.all)return condition.all.length>0&&condition.all.every(publicRequirement);
 return !!(condition.kn||condition.item||condition.gg!==undefined);
}
export function lockedProgression(condition,run,meta){return publicRequirement(condition)&&!check(condition,run,meta);}

const duelIds={'OPT-LOC-003-004':{event:'EVT-C2',knowledge:['KNW-004'],fee:50},'OPT-LOC-003-005':{event:'EVT-C3',knowledge:['KNW-004','KNW-011'],fee:100}};
export function duelRequirement(id){return duelIds[id]||null;}
export function missingDuelRequirements(id,run){
 const rule=duelRequirement(id);if(!rule)return [];
 const missing=rule.knowledge.filter(k=>!run.knowledge.includes(k)).map(k=>catalog.knowledge[k].name);
 if(!['ITM-003','ITM-001'].some(item=>(run.items[item]||0)>0))missing.push('可使用的牌組');
 if(run.gg<rule.fee)missing.push(rule.fee+' GG');
 return missing;
}
