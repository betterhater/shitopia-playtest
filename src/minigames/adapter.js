export const adapters={
 'GAME-C2':{minigameId:'GAME-C2',sourceEventId:'EVT-C2',availableOutcomes:[{id:'DBG-C2-SUCCESS',label:'模擬成功',next:'C2.win'},{id:'DBG-C2-FAIL',label:'模擬失敗',next:'C2.fail'}],canExit:false,debugOnly:true},
 'GAME-C3':{minigameId:'GAME-C3',sourceEventId:'EVT-C3',availableOutcomes:[{id:'DBG-C3-SUCCESS',label:'模擬成功',next:'C3.win'},{id:'DBG-C3-FAIL',label:'模擬失敗',next:'C3.fail'}],canExit:false,debugOnly:true},
 'GAME-F2':{minigameId:'GAME-F2',sourceEventId:'EVT-F2',availableOutcomes:[{id:'DBG-F2-NORMAL',label:'模擬一般成功',next:'F2.normal'},{id:'DBG-F2-TRUE',label:'模擬真結局成功',next:'F2.true'},{id:'DBG-F2-FAIL',label:'模擬失敗',next:'F2.fail'}],canExit:true,exitNext:'F2.fail',debugOnly:true},
 'GAME-D4':{minigameId:'GAME-D4',sourceEventId:'EVT-D4',availableOutcomes:[{id:'DBG-D4-SUCCESS',label:'模擬成功',next:'D4.success'},{id:'DBG-D4-FAIL',label:'模擬失敗',next:'D4.fail'}],canExit:false,debugOnly:true}
};
// Both debug buttons and a future real minigame return through this same validation boundary.
export function resolveResult(id,result){const a=adapters[id];if(!a)throw Error('Unknown adapter');if(result==='exit'&&a.canExit)return a.exitNext;const out=a.availableOutcomes.find(o=>o.id===result);if(!out)throw Error('Invalid minigame result');return out.next;}
