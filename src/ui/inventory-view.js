import {catalog} from '../data/catalog.js';
export function ownedItems(run){return Object.entries(run?.items||{}).filter(([id,count])=>catalog.items[id]&&count>0).map(([id,count])=>({...catalog.items[id],count}));}
