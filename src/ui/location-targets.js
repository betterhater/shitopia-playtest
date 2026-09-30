import {catalog} from '../data/catalog.js';

const npc=id=>({id,label:catalog.npcs[id].name,kind:'npc'});
const object=(id,label)=>({id,label,kind:'object'});
export const locationTargets={
 'LOC-001':[{...npc('NPC-003'),label:'小屎朋友們'}],
 'LOC-002':[object('temple-door','緊鎖的門扉'),npc('NPC-021'),object('temple-wall','爬滿藤蔓的石牆')],
 'LOC-003':[npc('NPC-005'),npc('NPC-004')],
 'LOC-004':[npc('NPC-007')],
 'LOC-005':[object('altar','下城區中央的破敗祭壇'),npc('NPC-019')],
 'LOC-006':[npc('NPC-009'),npc('NPC-008')],
 'LOC-007':[npc('NPC-009')],
 'LOC-008':[object('tree','刻有詭異痕跡的枯樹')],
 'LOC-009':[npc('NPC-020'),npc('NPC-013')],
 'LOC-010':[npc('NPC-014'),npc('NPC-015')],
 'LOC-011':[object('statue','覆著灰的雕像'),object('sword-seat','空蕩的劍座'),npc('NPC-017')],
 'LOC-012':[object('bookshelf','書櫃／調查與行動'),npc('NPC-018')],
 'LOC-013':[], 'LOC-014':[]
};
export function guardAlive(run){return !run.completed['EVT-D4']||run.knowledge.includes('KNW-028');}
export function visibleTargets(location,run){return (locationTargets[location]||[]).filter(t=>(t.id!=='NPC-009'||guardAlive(run))&&!(location==='LOC-012'&&t.id==='bookshelf')).concat(location==='LOC-002'&&run.seen.includes('temple.hole')?[object('temple-interior','神殿內部')]:[]);}
export function interactionTarget(location,interaction){
 if(interaction.target)return interaction.target;
 if(interaction.npc)return interaction.npc;
 if(location==='LOC-011'&&interaction.id.startsWith('NODE-LOC-011-003'))return 'sword-seat';
 return {'LOC-002':'temple-door','LOC-004':'crime-scene','LOC-005':'altar','LOC-008':'tree','LOC-011':'statue','LOC-012':'bookshelf'}[location]||null;
}
