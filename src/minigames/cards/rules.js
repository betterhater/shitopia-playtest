// OPEN v0.2 items: QA defaults are explicitly provisional and serializable.
export const OPEN_RULES={ceReplacement:'未鎖定',sewerTarget:'未鎖定',dragonfruitTiming:'未鎖定',freezeConsumesOnce:'未鎖定',playerDeckOrderPolicy:'未鎖定',spDiscardProtection:'未鎖定',drunkProfile:'OPEN DATA',gesture:'CURRENT IMPLEMENTATION',frameCoordinates:'未鎖定',specialAnimation:'未鎖定',nonChampionBack:'未鎖定'};
export const QA_RULES={ceReplacement:'REPLACE',sewerTarget:'CONTROLLER',dragonfruitTiming:'WEAKEN',freezeConsumesOnce:false,playerDeckOrderPolicy:'SEEDED_SHUFFLE',spDiscardProtection:false};
export const TRANSITION={holdMs:1000,fadeMs:1100,darkenMs:900,entranceMs:3150,blurMs:450,shakeCycleMs:120,shakePx:7,blurPx:7};
export function rng(s){s.rngState=(Math.imul(1664525,s.rngState)+1013904223)>>>0;return s.rngState/4294967296;}
export const randomPick=(s,values)=>values.length?values[Math.floor(rng(s)*values.length)]:null;
export function shuffled(s,values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
