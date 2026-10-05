// Presentation only: never changes race IDs, story conditions, or minigame rules.
export const appearanceMode=value=>value==='realistic'?'realistic':'normal';
// A public ordinary link omits mode; it must not inherit the viewer's own quiz.
export const resultAppearance=(publicData,quiz)=>appearanceMode(publicData?publicData.mode:quiz?.mode);
export const resultAssetId=(race,mode='normal')=>'IMG-RES-'+(appearanceMode(mode)==='realistic'?'REALISTIC-':'')+race.slice(4);
export const playerAssetId=(race,mode='normal')=>'SPR-NPC-001-'+(appearanceMode(mode)==='realistic'?'REALISTIC-':'')+race.slice(4);
export const savedAppearance=game=>appearanceMode(game.run?.appearanceMode??game.quiz?.mode);
// Only cloned/loaded saves are hydrated. Legacy snapshots inherit their own save's
// appearance, never a title-screen selection or another currently active run.
export function hydrateAppearance(game){
 const mode=savedAppearance(game);
 if(game.run)game.run.appearanceMode=mode;
 for(const snapshot of Object.values(game.checkpoints||{}))if(snapshot)snapshot.appearanceMode=mode;
 if(game.quiz)game.quiz.mode=mode;
 return game;
}
