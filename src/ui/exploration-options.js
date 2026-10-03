import {check} from '../engine/conditions.js';
import {lockedProgression,SCHOLAR_COPY,scholarStage} from './requirements.js';
import {interactionTarget} from './location-targets.js';

export const introductionIds=['OPT-LOC-003-001','OPT-LOC-005-005','OPT-LOC-002-001','OPT-LOC-012-001'];
export const libraryObservation='OPT-LOC-012-002';
export function askedBefore(option,run){return introductionIds.includes(option.source)&&run.seen.includes(option.source);}
export function visibleOption(option,run,meta){if(option.id===SCHOLAR_COPY)return scholarStage(run);return check(option.displayCondition,run,meta)&&(check(option.condition,run,meta)||lockedProgression(option.condition,run,meta,option.id));}
export function targetOptions(location,target,list,run,meta){return list.filter(o=>interactionTarget(location,o)===target&&visibleOption(o,run,meta)&&!(target==='bookshelf'&&o.id===libraryObservation));}
export function directOptions(location,list){return location==='LOC-012'?list.filter(o=>o.id===libraryObservation):[];}
