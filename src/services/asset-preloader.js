import {catalog} from '../data/catalog.js';
export class AssetPreloader{
 constructor({ImageClass=globalThis.Image,idle=globalThis.requestIdleCallback?.bind(globalThis),fallback=(fn,delay)=>globalThis.setTimeout(fn,delay),timeout=4000}={}){this.ImageClass=ImageClass;this.idle=idle;this.fallback=fallback;this.timeout=timeout;this.references=new Map();this.promises=new Map();this.started=false;}
 load(id,priority='low'){
  const path=catalog.assets[id]?.path;if(!path||catalog.assets[id].missing)return Promise.resolve(false);
  if(this.references.has(id)){this.references.get(id).fetchPriority=priority;return this.promises.get(id);}
  const img=new this.ImageClass();this.references.set(id,img);img.fetchPriority=priority;img.decoding='async';
  const promise=new Promise(resolve=>{let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);resolve(ok);};const timer=this.fallback(()=>finish(false),this.timeout);
   img.onerror=()=>finish(false);img.onload=()=>{if(img.decode)Promise.resolve().then(()=>img.decode()).then(()=>finish(true),()=>finish(true));else finish(true);};
   img.src=new URL('../../'+path,import.meta.url).href;
  });this.promises.set(id,promise);return promise;
 }
 group(ids,priority='low'){return Promise.all(ids.map(id=>this.load(id,priority)));}
 start(){if(this.started)return;this.started=true;this.group(['DRGN','SHPB','SOUP','STIC'].map(s=>'IMG-RES-'+s).concat('IMG-UI-TOILET'),'high');const work=()=>this.group(['DRGN','SHPB','SOUP','STIC'].map(s=>'SPR-NPC-001-'+s).concat('LOC-001','NPC-002','NPC-003'));if(this.idle)this.idle(work,{timeout:1500});else this.fallback(work,250);}
 result(races){return this.group(races.map(id=>catalog.races[id].sprite).concat('LOC-001','NPC-002','NPC-003'),'high');}
}
