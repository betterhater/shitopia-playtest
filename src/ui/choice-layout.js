export function visualTextWidth(text){return [...text].reduce((n,c)=>n+(/[\u0000-\u007f]/.test(c)?.5:1),0);}
export function isCompactChoiceSet(options,width,fontSize=16){
 return options.length>=2&&options.every(o=>{const units=visualTextWidth(typeof o==='string'?o:o.text);return units<=18&&units*fontSize+26<=(width-10)/2;});
}
