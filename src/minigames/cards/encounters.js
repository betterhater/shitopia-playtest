// 2026-10-04 17:34 user ruling: Drunk = DUEL + existing normal (MEDIUM) AI.
export const cardsEncounters={
 'GAME-C2':{sourceEventId:'EVT-C2',enemyProfile:'CARD_ENEMY_DRUNK',enemyDeck:'DUEL',enemyTier:'MEDIUM',enemyOrder:'SHUFFLED'},
 'GAME-C3':{sourceEventId:'EVT-C3',enemyProfile:'CARD_ENEMY_CHAMPION',enemyDeck:'CHAMPION',enemyTier:'STRONG',enemyOrder:'FIXED'}
};
export function cardsEncounterForRun(run){
 const encounter=cardsEncounters[run.pending];if(!encounter)throw Error('Not a Cards encounter');
 const prefix='OPT-'+encounter.sourceEventId.slice(4)+'-';
 const selection=[...run.history].reverse().find(h=>h.option===prefix+'001'||h.option===prefix+'002');
 if(!selection)throw Error('Missing formal Cards deck selection');
 return {...encounter,playerDeck:selection.option.endsWith('002')?'GREAT':'DUEL'};
}
