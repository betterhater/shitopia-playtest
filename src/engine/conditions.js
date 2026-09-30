export function check(c,run,meta){
 if(!c)return true;if(Array.isArray(c))return c.every(v=>check(v,run,meta));
 if(c.all)return c.all.every(v=>check(v,run,meta));if(c.any)return c.any.some(v=>check(v,run,meta));if(c.not)return !check(c.not,run,meta);
 if(c.kn)return run.knowledge.includes(c.kn);if(c.item)return (run.items[c.item]||0)>=(c.count||1);
 if(c.gg!==undefined)return run.gg>=c.gg;if(c.race)return run.race===c.race;if(c.demon)return run.demon===c.demon;
 if(c.flag)return !!run.flags[c.flag];if(c.done)return !!run.completed[c.done];if(c.counter)return (run.counters[c.counter]||0)>=(c.min??1);
 if(c.seen)return run.seen.includes(c.seen);if(c.achievement)return meta.achievements.includes(c.achievement);
 throw Error('Unknown condition '+JSON.stringify(c));
}
