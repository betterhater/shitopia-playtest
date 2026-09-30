import {clone,freshMeta} from '../engine/state.js';
const PREFIX='shitopia:v1:';
export const SAVE_VERSION=1;
export class SaveManager{
 constructor(storage=globalThis.localStorage){this.storage=storage;}
 read(key){try{const text=this.storage.getItem(PREFIX+key);return text?JSON.parse(text):null;}catch{throw Error('本機資料無法讀取，請保留現有資料後重試。');}}
 write(key,data){try{this.storage.setItem(PREFIX+key,JSON.stringify(data));}catch{throw Error('本機儲存失敗，可能是空間不足或瀏覽器禁止儲存。');}}
 slotKey(slot){if(slot==='auto')return 'auto';if(!Number.isInteger(slot)||slot<1||slot>5)throw Error('Invalid slot');return 'slot:'+slot;}
 save(slot,game){if(!game.run)throw Error('請先開始冒險');const data={saveVersion:SAVE_VERSION,savedAt:new Date().toISOString(),run:clone(game.run),checkpoints:clone(game.checkpoints),quiz:clone(game.quiz)};this.write(this.slotKey(slot),data);this.meta(game.meta);return data;}
 peek(slot){const d=this.read(this.slotKey(slot));if(d)this.validate(d);return d;}
 validate(d){if(d.saveVersion!==SAVE_VERSION||!d.run||!d.checkpoints||typeof d.run.name!=='string'||!Number.isFinite(d.run.gg)||d.run.gg<0||!Array.isArray(d.run.knowledge)||!Array.isArray(d.run.history)||!d.run.items||!d.run.flags||!d.run.counters)throw Error('存檔格式損壞或版本不支援，未覆寫現有進度。');}
 load(slot,game){const d=this.peek(slot);if(!d)throw Error('此欄位沒有存檔');const stored=this.read('meta')||freshMeta();game.meta.achievements=[...new Set([...game.meta.achievements,...(stored.achievements||[])])];game.meta.endings=[...new Set([...game.meta.endings,...(stored.endings||[])])];game.meta.quizCompleted||=stored.quizCompleted;game.meta.realisticUnlocked||=stored.realisticUnlocked;game.run=clone(d.run);game.checkpoints=clone(d.checkpoints);game.quiz=clone(d.quiz);game.notices=[];return game;}
 delete(slot){this.storage.removeItem(PREFIX+this.slotKey(slot));}
 meta(meta){this.write('meta',meta);}
 reset(){for(let i=this.storage.length-1;i>=0;i--){const k=this.storage.key(i);if(k?.startsWith(PREFIX))this.storage.removeItem(k);}}
}
