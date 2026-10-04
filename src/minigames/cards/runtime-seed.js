// QA/simulation call freshMatch with their explicit seeds; formal matches use this.
export function productionRuntimeSeed(cryptoSource=globalThis.crypto){
 if(cryptoSource?.getRandomValues){try{return cryptoSource.getRandomValues(new Uint32Array(1))[0];}catch{}}
 return (Math.floor(Math.random()*0x100000000)^Date.now()^Math.floor((globalThis.performance?.now?.()||0)*1000))>>>0;
}
