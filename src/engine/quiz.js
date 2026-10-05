import {catalog} from '../data/catalog.js';
export const raceOrder=['RAC-DRGN','RAC-SHPB','RAC-SOUP','RAC-STIC'];
export const REALISTIC_MODE_ENABLED=true;
export function validName(name){return typeof name==='string'&&name.trim().length>0;}
export function startQuiz(name,random=Math.random){if(!validName(name))throw Error('請先輸入名字。');return {name:name.trim(),answers:[],orders:catalog.quiz.map(q=>{const a=q.options.map(o=>o.id);for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;})};}
export function scoreQuiz(quiz){const scores=Object.fromEntries(raceOrder.map(id=>[id,0]));quiz.answers.forEach((id,i)=>{const o=catalog.quiz[i]?.options.find(o=>o.id===id);if(o)scores[o.race]++;});const max=Math.max(...Object.values(scores));return {scores,winners:raceOrder.filter(id=>scores[id]===max)};}
