import {LANES} from './data.js';
// The board map is authoritative: one entity per slot, one slot per entity.
export function boardOccupancyIssues(state){
 const issues=[],seen=new Map();
 for(const side of ['player','enemy'])for(const lane of LANES){const unit=state.players[side].board[lane];if(unit==null)continue;
  const slot=side+':'+lane;
  if(Array.isArray(unit)||typeof unit!=='object'||!unit.instanceId){issues.push(slot+' invalid occupant');continue;}
  if(seen.has(unit.instanceId))issues.push(slot+' duplicate '+unit.instanceId+' at '+seen.get(unit.instanceId));else seen.set(unit.instanceId,slot);
  if(unit.lane!==lane||unit.controller!==side)issues.push(slot+' disagrees with entity lane/controller');
 }
 return issues;
}
export function assertBoardOccupancy(state){const issues=boardOccupancyIssues(state);if(issues.length){const error=new Error('Cards occupancy invariant: '+issues.join('; '));error.name='BoardOccupancyError';throw error;}return state;}
