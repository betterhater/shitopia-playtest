import {catalog} from '../data/catalog.js';
import {grant,finishEnding,royalEnding} from './achievements.js';
export function loseDemon(game){const previous=game.run.demon;if(previous==='DMN-NONE'||!catalog.demons[previous])return false;game.run.demon='DMN-NONE';game.notices??=[];game.notices.push({kind:'info',message:'你失去了自己的屎魔。'});return true;}
export function effects(game,list=[]){const r=game.run;for(const e of list){switch(e.type){
 case 'knowledge': if(!catalog.knowledge[e.id])throw Error('Unknown knowledge '+e.id);if(!r.knowledge.includes(e.id)){r.knowledge.push(e.id);game.notices??=[];game.notices.push({kind:'knowledge',message:'獲得知識：'+catalog.knowledge[e.id].name});}break;
 case 'item':if(!catalog.items[e.id])throw Error('Unknown item '+e.id);if((r.items[e.id]||0)+(e.amount??1)<0)throw Error('Insufficient item');r.items[e.id]=(r.items[e.id]||0)+(e.amount??1);if((e.amount??1)>0){game.notices??=[];game.notices.push({kind:'item',message:'獲得道具：'+catalog.items[e.id].name+((e.amount??1)>1?' ×'+e.amount:'')});}break;
 case 'gg':if(r.gg+e.amount<0)throw Error('Insufficient GG');r.gg+=e.amount;break;
 case 'flag':r.flags[e.id]=e.value??true;break;
 case 'counter':r.counters[e.id]=(r.counters[e.id]||0)+(e.amount??1);break;
 case 'seen':if(!r.seen.includes(e.id))r.seen.push(e.id);break;
 case 'demon':if(e.id==='DMN-NONE')loseDemon(game);else r.demon=e.id;break;
 case 'loseDemon':loseDemon(game);break;
 case 'betray':loseDemon(game);r.flags['FLG-RUN-DEMON-BETRAYED']=true;grant(game.meta,'ACH-8',game.notices);break;
 case 'achievement':grant(game.meta,e.id,game.notices);break;
 case 'complete':r.completed[e.id]=true;break;
 case 'ending':finishEnding(game,e.id==='royal'?royalEnding(r,r.event):e.id);break;
 case 'visit':r.visit[e.id]=e.value??true;break;
 default:throw Error('Unknown effect '+e.type);
 }}
 // Inventory-driven knowledge is idempotent and runs after every transaction.
 const derived=[['ITM-003','KNW-006'],['ITM-001','KNW-007'],['ITM-011','KNW-032'],['ITM-012','KNW-033'],['ITM-013','KNW-034']];
 const add=id=>{if(!r.knowledge.includes(id)){r.knowledge.push(id);game.notices??=[];game.notices.push({kind:'knowledge',message:'獲得知識：'+catalog.knowledge[id].name});}};
 for(const [item,kn]of derived)if(r.items[item]>0)add(kn);if(r.items['ITM-009']>0&&r.items['ITM-010']>0){add('KNW-021');add('KNW-051');}
}
