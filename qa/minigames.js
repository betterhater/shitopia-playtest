import {mountQaCenter} from '../src/minigames/qa-center.js';
const host=document.querySelector('#qa');
mountQaCenter(host,{standalone:true,onReturn:()=>location.href='../index.html'});
