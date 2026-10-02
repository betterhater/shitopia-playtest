const cache=new Map();
export const TAIL_FALLBACK='rgb(38, 60, 44)';
export function averageRGB(pixels){let r=0,g=0,b=0,n=0;for(let i=0;i<pixels.length;i+=4){const alpha=pixels[i+3]/255;r+=pixels[i]*alpha;g+=pixels[i+1]*alpha;b+=pixels[i+2]*alpha;n+=alpha;}return n?`rgb(${Math.round(r/n)}, ${Math.round(g/n)}, ${Math.round(b/n)})`:TAIL_FALLBACK;}
export function applyBackdropTail(frame,backdrop,id){
 const apply=color=>frame.style.setProperty('--backdrop-tail-color',color);
 if(cache.has(id)){apply(cache.get(id));return;}
 apply(TAIL_FALLBACK);const img=backdrop.querySelector('img');if(!img)return;
 const sample=()=>{if(cache.has(id)){apply(cache.get(id));return;}if(!img.naturalWidth)return;
  let color=TAIL_FALLBACK;try{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=4;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,img.naturalHeight*.96,img.naturalWidth,img.naturalHeight*.04,0,0,64,4);color=averageRGB(ctx.getImageData(0,0,64,4).data);}catch{/* file/CORS failure keeps the local deep-green fallback. */}
  cache.set(id,color);apply(color);
 };if(img.complete)sample();else img.addEventListener('load',sample,{once:true});
}
