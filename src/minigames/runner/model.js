export const LANES=['LEFT','CENTER','RIGHT'];
export const keyDirection=key=>['ArrowLeft','a','A'].includes(key)?-1:['ArrowRight','d','D'].includes(key)?1:0;
export const RUNNER_BALANCE={goal:300,baseProgressSpeed:6.05,scrollSpeed:.528,backgroundScrollSpeed:.30,invincibilityMs:2000,hazardInterval:2.2,jitter:.25,recoveryChance:.18,laneDuration:.16,rowDuration:.28,reactionTime:.75,phases:[{speed:1,visualScroll:1,frequency:1,recovery:1,pressure:0},{speed:1.1,visualScroll:1.2,frequency:1.3,recovery:.8,pressure:.25},{speed:1.2,visualScroll:1.4,frequency:1.5,recovery:.5,pressure:.5}]};
export const RUNNER_VISUAL={obstacle1:2,obstacle2:2,magic1:1.5,magic2:1.5,recovery:1};
export const RUNNER_HITBOX={vertical:.052,lane:.36};
export const hazardTypes={obstacle1:{speed:1,damage:1,direction:1},obstacle2:{speed:1,damage:1,direction:1},magic1:{speed:1.05,damage:2,direction:-1},magic2:{speed:1.15,damage:1,direction:-1},recovery:{speed:1,damage:-1,direction:1}};
export const phaseFor=progress=>RUNNER_BALANCE.phases[Math.min(2,Math.floor(progress/100))];
export const rowY=row=>.78-row*.08;
export function freshRunner(){return {progress:0,row:4,visualRow:4,lane:1,visualLane:1,laneFrom:1,laneElapsed:0,time:0,visualDistance:0,invincibleUntilMs:0,nextSpawn:1.4,entities:[],sequence:0,result:null};}
export function moveLane(s,direction){if(s.result||s.laneElapsed<RUNNER_BALANCE.laneDuration&&s.visualLane!==s.lane)return false;const next=s.lane+Math.sign(direction);if(next<0||next>2||next===s.lane)return false;s.laneFrom=s.visualLane;s.lane=next;s.laneElapsed=0;return true;}
export function tapLane(s,lane){return Math.abs(lane-s.lane)===1&&moveLane(s,lane-s.lane);}
export const isInvincible=s=>s.time*1000<s.invincibleUntilMs;
export function hit(s,type){const damage=hazardTypes[type].damage;if(damage>0&&isInvincible(s))return false;s.row=Math.min(4,s.row-damage);if(damage>0)s.invincibleUntilMs=s.time*1000+RUNNER_BALANCE.invincibilityMs;if(s.row<=-1)s.result='FAIL';return true;}
// Pair waves occupy adjacent lanes; the third lane remains reachable with
// at least 1.3 seconds notice. P1 has no simultaneous front/back wave.
export function spawnWave(s,random=Math.random){const p=phaseFor(s.progress),occupied=[...new Set(s.entities.filter(e=>e.type!=='recovery'&&!e.hit).map(e=>e.lane))];let lane=Math.floor(random()*3);const back=random()<.4;const type=back?(random()<.5?'magic1':'magic2'):(random()<.5?'obstacle1':'obstacle2');
 if(p.pressure===0&&occupied.length){s.nextSpawn=s.time+.15;return;}
 if(occupied.length>=2&&!occupied.includes(lane))lane=occupied[Math.floor(random()*occupied.length)];const wave=[{type,lane}];
 if(p.pressure&&random()<p.pressure){const second=lane===1?(random()<.5?0:2):1;wave.push({type:back?'obstacle1':'magic2',lane:second});}
 if(new Set([...occupied,...wave.map(e=>e.lane)]).size>2)wave.pop();
 for(const entry of wave){const h=hazardTypes[entry.type],speed=RUNNER_BALANCE.scrollSpeed*p.speed*h.speed*h.direction;s.entities.push({...entry,id:++s.sequence,y:h.direction===1?-.15:1.12,speed,hit:false});}
 if(random()<RUNNER_BALANCE.recoveryChance*p.recovery){const safe=[0,1,2].filter(l=>!wave.some(e=>e.lane===l));s.entities.push({id:++s.sequence,lane:safe[Math.floor(random()*safe.length)],type:'recovery',y:-.12,speed:RUNNER_BALANCE.scrollSpeed*p.speed,hit:false});}
 s.nextSpawn=s.time+RUNNER_BALANCE.hazardInterval/p.frequency*(1+(random()*2-1)*RUNNER_BALANCE.jitter);
}
export function stepRunner(s,delta,random=Math.random){if(s.result||delta<=0)return s;let remaining=delta;
 // Time-based substeps keep slow frames from tunnelling through hazards.
 while(remaining>0&&!s.result){const dt=Math.min(remaining,1/120);remaining-=dt;s.time+=dt;const p=phaseFor(s.progress);s.visualDistance+=RUNNER_BALANCE.backgroundScrollSpeed*p.visualScroll*dt;s.progress=Math.min(300,s.progress+RUNNER_BALANCE.baseProgressSpeed*p.speed*dt);
  s.laneElapsed=Math.min(RUNNER_BALANCE.laneDuration,s.laneElapsed+dt);const t=s.laneElapsed/RUNNER_BALANCE.laneDuration;s.visualLane=s.laneFrom+(s.lane-s.laneFrom)*(t*t*(3-2*t));
  const diff=s.row-s.visualRow;s.visualRow+=Math.sign(diff)*Math.min(Math.abs(diff),dt/RUNNER_BALANCE.rowDuration);if(s.time>=s.nextSpawn)spawnWave(s,random);
  const y=rowY(s.visualRow);for(const e of s.entities){e.y+=e.speed*dt;if(!e.hit&&Math.abs(e.y-y)<RUNNER_HITBOX.vertical&&Math.abs(e.lane-s.visualLane)<RUNNER_HITBOX.lane){e.hit=true;hit(s,e.type);if(s.result)break;}}
  s.entities=s.entities.filter(e=>e.y>-.6&&e.y<1.5&&!e.hit);if(!s.result&&s.progress>=300)s.result='SUCCESS';
 }return s;
}
