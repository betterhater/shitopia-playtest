const durations={knowledge:5000,item:5000,achievement:6000,info:4200};
export class NotificationQueue{
 constructor({mount,unmount,now=()=>Date.now(),setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),spacing=190}){
  this.mount=mount;this.unmount=unmount;this.now=now;this.setTimer=setTimer;this.clearTimer=clearTimer;this.spacing=spacing;
  this.nextId=1;this.nextMountAt=0;this.entries=new Map();
 }
 enqueueBatch(entries){return entries.map(entry=>this.enqueue(entry));}
 enqueue(value){const entry=typeof value==='string'?{kind:'info',message:value}:value;
  const id=this.nextId++,scheduled=Math.max(this.now(),this.nextMountAt),delay=Math.max(0,scheduled-this.now());
  this.nextMountAt=scheduled+this.spacing;
  const notice={...entry,id,mountedAt:null,duration:durations[entry.kind]??durations.info,mountTimer:null,removalTimer:null};
  this.entries.set(id,notice);
  notice.mountTimer=this.setTimer(()=>{if(!this.entries.has(id))return;notice.mountedAt=this.now();this.mount(notice);notice.removalTimer=this.setTimer(()=>this.dismiss(id),notice.duration);},delay);
  return id;
 }
 dismiss(id){const entry=this.entries.get(id);if(!entry)return;this.clearTimer(entry.mountTimer);if(entry.removalTimer!==null)this.clearTimer(entry.removalTimer);this.entries.delete(id);if(entry.mountedAt!==null)this.unmount(entry);}
 clear(){for(const id of [...this.entries.keys()])this.dismiss(id);this.nextMountAt=0;}
}
