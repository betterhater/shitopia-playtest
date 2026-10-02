import {catalog} from '../data/catalog.js';
import {graph,events,interactions,links} from '../data/story.js';
import {clone,freshRun} from './state.js';
import {check} from './conditions.js';
import {effects} from './effects.js';
import {grant} from './achievements.js';
import {resolveResult} from '../minigames/adapter.js';
import {hubFor} from '../ui/navigation.js';
import {storyLineText} from '../ui/story-line.js';
export class Engine{
 constructor(game){this.game=game;}
 get run(){return this.game.run;}
 snapshot(kind){this.game.checkpoints[kind]=clone(this.run);}
 start(name,race,demon){if(!catalog.races[race]||!catalog.demons[demon])throw Error('Invalid character');this.game.run=freshRun(name,race,demon);this.game.checkpoints={option:null,event:null,adventure:null};if(['ACH-00','ACH-0','ACH-1','ACH-2','ACH-3','ACH-4','ACH-44'].some(id=>this.game.meta.achievements.includes(id)))grant(this.game.meta,'ACH-5',this.game.notices);this.snapshot('adventure');this.startEvent('EVT-A');}
 startEvent(id){const ev=events[id];if(!ev)throw Error('Unknown event '+id);const r=this.run;r.location=ev.location;r.mode='explore';r.node=null;r.line=0;r.pending=null;r.event=null;r.sceneCast=null;this.snapshot('event');r.event=id;r.history.push({event:id});this.goto(ev.start);}
 goto(id){const r=this.run;if(!id){this.leave();return;}if(!graph[id])throw Error('Unknown node '+id);r.node=id;r.line=0;r.mode='story';r.pending=null;if(graph[id].location)r.location=graph[id].location;this.settle();}
 settle(){for(let safety=0;safety<80;safety++){const r=this.run,n=graph[r.node];if(!n||r.mode==='ending')return;if(r.line<n.lines.length)return;if(n.choices){r.mode='choice';return;}if(n.minigame){r.mode='minigame';r.pending=n.minigame;return;}if(n.shop){r.mode='shop';return;}
 effects(this.game,n.effects);if(r.mode==='ending'){if(r.event)r.completed[r.event]=true;return;}if(n.startEvent){this.startEvent(n.startEvent);return;}if(n.returnLocation)r.location=n.returnLocation;
 const next=n.branches?n.branches.find(b=>check(b.condition,r,this.game.meta))?.next:n.next;
 if(!next){this.leave();return;}r.node=next;r.line=0;if(graph[next].location)r.location=graph[next].location;
 }throw Error('Automatic graph cycle');}
 advance(){if(this.run.mode!=='story')return;const n=graph[this.run.node],line=n.lines[this.run.line];if(line){this.run.history.push({source:line.source,text:storyLineText(line,this.run)});this.run.line++;if(line.after)effects(this.game,line.after);}this.settle();}
 options(){const n=graph[this.run.node];return (n?.choices||[]).filter(o=>check(o.condition,this.run,this.game.meta));}
 choose(id){if(this.run.mode!=='choice')throw Error('No active choice');const o=this.options().find(o=>o.id===id);if(!o||o.disabled&&check(o.disabled,this.run,this.game.meta))throw Error('Unavailable choice');this.snapshot('option');effects(this.game,[{type:'seen',id:o.source},...(o.effects||[])]);this.run.history.push({option:o.id});this.goto(o.next);}
 result(id){if(this.run.mode!=='minigame'||!this.run.pending)throw Error('No minigame pending');const next=resolveResult(this.run.pending,id);this.run.history.push({result:id});this.goto(next);}
 leave(){const r=this.run;r.mode='explore';r.node=null;r.line=0;r.pending=null;r.event=null;r.sceneCast=null;}
 available(){return (interactions[this.run.location]||[]).filter(o=>check(o.condition,this.run,this.game.meta)&&!(this.run.location==='LOC-011'&&this.run.visit.monkAngry&&o.npc==='NPC-017'));}
 interact(id){if(this.run.mode!=='explore')throw Error('Not exploring');const o=this.available().find(o=>o.id===id);if(!o)throw Error('Unavailable interaction');this.snapshot('option');effects(this.game,[{type:'seen',id:o.source}]);this.run.history.push({interaction:id});if(o.event)this.startEvent(o.event);else{this.run.event=null;this.run.sceneCast=null;this.snapshot('event');this.goto(o.node);}}
 destinations(){return (links[this.run.location]||[]).map(l=>typeof l==='string'?{id:l}:l).filter(l=>check(l.condition,this.run,this.game.meta));}
 move(id){if(this.run.mode!=='explore'||!this.destinations().some(l=>l.id===id))throw Error('Unavailable destination');this.run.location=id;this.run.visit={};this.run.sceneCast=null;if(id==='LOC-002')effects(this.game,[{type:'knowledge',id:'KNW-019'}]);this.run.history.push({location:id});}
 returnHub(){const id=hubFor(this.run.location);if(!id||this.run.mode!=='explore')throw Error('Unavailable hub return');if(this.destinations().some(l=>l.id===id)){this.move(id);return;}this.run.location=id;this.run.visit={};this.run.sceneCast=null;this.run.history.push({location:id});}
 buy(id){if(this.run.mode!=='shop')throw Error('Not shopping');const product=catalog.shop.find(p=>p.id===id);if(!product||this.run.gg<product.price)throw Error('GG 不足');effects(this.game,[{type:'gg',amount:-product.price},{type:'item',id}]);}
 rewind(kind){const r=this.game.checkpoints[kind];if(!r)return false;this.game.run=clone(r);if(kind==='adventure'){this.game.checkpoints.option=null;this.game.checkpoints.event=null;this.startEvent('EVT-A');}else if(kind==='event')this.game.checkpoints.option=null;this.game.notices=[];return true;}
}
