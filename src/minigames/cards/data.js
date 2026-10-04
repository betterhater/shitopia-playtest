import {definitions} from './definitions.js';
const timings={CE003:['ROUND_START'],CE004:['ROUND_START'],CE005:['ROUND_START'],LM002:['ENHANCE'],LM003:['WEAKEN'],LM004:['PROTECT'],LM005:['WEAKEN'],LM006:['BEFORE_TARGET_ATTACK'],LM007:['BEFORE_ATTACK'],LM008:['PROTECT'],LM009:['ENHANCE','WEAKEN'],LM010:['MODIFIER_ADDED'],LM011:['ATTACK_TARGET'],LM012:['CONFIGURED'],LM013:['ROUND_END'],LM014:['PROTECT'],UM001:['AFTER_ATTACK'],UM002:['DAMAGE'],UM003:['ROUND_START','ROUND_END'],UM004:['PROTECT','DEATH']};
export const cards=Object.fromEntries(Object.entries(definitions).map(([id,d])=>[id,{...d,timings:timings[id]||[d.type==='IE'?'ON_PLAY':d.type==='SP'?'HAND_ENTER':'AURA'],effectTags:timings[id]||[d.type],targeting:id==='LM011'?'ENEMY_R_M_L':d.type==='IE'?'EXPLICIT':'OWNER_LOCAL',triggerLimit:['LM002','LM003','LM004','LM005','LM008','LM009','LM012','LM014','UM004'].includes(id)?'ONCE_PER_ABILITY':'PER_EVENT'}]));
export const LANES=['L','M','R'];
export const other=side=>side==='player'?'enemy':'player';
export const PHASES=['ROUND_START','DRAW','FIRST_DEPLOY','SECOND_DEPLOY','ENHANCE','PROTECT','WEAKEN','BATTLE_START','BATTLE_ACTIONS','ROUND_SCORE','ROUND_END','MATCH_END_CHECK'];
export const SPECIAL_WIN_DARK_EXODIA='SPECIAL_WIN_DARK_EXODIA';
