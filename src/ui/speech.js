import {catalog} from '../data/catalog.js';
import {normalizeDisplayText} from './display-text.js';

const aliases={'小屎朋友Ａ':'NPC-003','小屎朋友Ｂ':'NPC-002','小屎朋友A':'NPC-003','小屎朋友B':'NPC-002','老人':'NPC-013','屎特維爾三世':'NPC-012','你與醉醺醺的酒客':'NPC-004'};
const normalized=s=>s.replaceAll(' ','');
// Recognition reads the original source; only the display text loses its speaker prefix.
export function parseSpeech(source,{name='旅人',demon=''}={}){
 const original=String(source||''),display=normalizeDisplayText(original),match=display.match(/^\s*([^：:\n「]+)[：:]\s*([\s\S]*)$/);
 let speaker=null,body=display;
 if(match){const label=match[1].trim();speaker=label==='用戶名'?'NPC-001':aliases[label]||Object.keys(catalog.npcs).find(id=>normalized(catalog.npcs[id].name)===normalized(label))||null;
  if(speaker){body=match[2];if(body.startsWith('「')&&body.endsWith('」'))body=body.slice(1,-1);}
 }
 return {speaker,name:speaker?(speaker==='NPC-001'?name:catalog.npcs[speaker].name):'旁白',text:normalizeDisplayText(body).replaceAll('用戶名',name).replaceAll('{demon}',demon),original};
}
