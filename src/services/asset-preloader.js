import {catalog} from '../data/catalog.js';
import {imageURL,imagePath} from './image-source.js';
import {appearanceMode,resultAssetId,playerAssetId} from './appearance.js';
export class AssetPreloader{
 constructor({ImageClass=globalThis.Image,idle=globalThis.requestIdleCallback?.bind(globalThis),fallback=(fn,delay)=>globalThis.setTimeout(fn,delay),timeout=4000}={}){this.ImageClass=ImageClass;this.idle=idle;this.fallback=fallback;this.timeout=timeout;this.references=new Map();this.promises=new Map();this.started=new Set();}
 load(id,priority='low'){
  const path=catalog.assets[id]?.path;if(!path||catalog.assets[id].missing)return Promise.resolve(false);
  if(this.references.has(id)){this.references.get(id).fetchPriority=priority;return this.promises.get(id);}
  const img=new this.ImageClass();this.references.set(id,img);img.fetchPriority=priority;img.decoding='async';
  const promise=new Promise(resolve=>{let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);resolve(ok);};const timer=this.fallback(()=>finish(false),this.timeout);
   let original=false;img.onerror=()=>{if(!original&&imagePath(path)!==path){original=true;img.src=imageURL(path,true);}else finish(false);};img.onload=()=>{if(img.decode)Promise.resolve().then(()=>img.decode()).then(()=>finish(true),()=>finish(true));else finish(true);};
   img.src=imageURL(path);
  });this.promises.set(id,promise);return promise;
 }
 group(ids,priority='low'){return Promise.all(ids.map(id=>this.load(id,priority)));}
 start(mode='normal'){mode=appearanceMode(mode);if(this.started.has(mode))return;this.started.add(mode);const work=()=>this.group(['DRGN','SHPB','SOUP','STIC'].map(s=>resultAssetId('RAC-'+s,mode)).concat('IMG-UI-TOILET'),'low');if(this.idle)this.idle(work,{timeout:1500});else this.fallback(work,250);}
 result(races,mode='normal'){return this.group(races.map(id=>resultAssetId(id,mode)).concat('IMG-UI-TOILET'),'high');}
 adventure(races,mode='normal'){return this.group(races.map(id=>playerAssetId(id,mode)).concat('LOC-001','NPC-002','NPC-003'),'high');}
}
