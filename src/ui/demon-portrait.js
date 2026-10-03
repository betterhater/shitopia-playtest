export const demonAssets={
 'DMN-NONE':null,'DMN-DRAGONFRUIT':'SPR-DEMON-DRAGONFRUIT',
 'DMN-ENOKI':'SPR-DEMON-ENOKI','DMN-CORN':'SPR-DEMON-CORN'
};
const normal={left:{x:.89,y:.43},right:{x:.21,y:.43}};
export const playerPortraitMeta={
 'SPR-NPC-001-SHPB':{demonAnchor:normal},
 'SPR-NPC-001-SOUP':{demonAnchor:normal},
 'SPR-NPC-001-STIC':{demonAnchor:normal},
 'SPR-NPC-001-DRGN':{demonAnchor:{left:{x:.89,y:.45},right:{x:.18,y:.45}}}
};
// Contain + bottom alignment in the already scaled image's rendered bounds.
// Size comes from the unscaled base slot and normal scale 1.2, never DRGN 1.518.
export function demonGeometry(id,side,base,rendered,natural={width:1200,height:1800}){
 const ratio=natural.width/natural.height,height=Math.min(rendered.height,rendered.width/ratio),width=height*ratio;
 const size=Math.min(base.height,base.width/ratio)*1.2*.29;
 const anchor=playerPortraitMeta[id].demonAnchor[side];
 const left=rendered.left+(rendered.width-width)/2,top=rendered.top+rendered.height-height;
 return {size,left:left+width*anchor.x-base.left-size/2,top:top+height*anchor.y-base.top-size*.85};
}
export function positionDemon(box){
 const demon=box.querySelector('.demon-wrapper'),img=box.querySelector('.portrait-visual-wrapper img');
 if(!demon||!img?.naturalWidth||!box.isConnected)return;
 const g=demonGeometry(box.dataset.portraitId,box.classList.contains('slot-left')?'left':'right',box.getBoundingClientRect(),img.getBoundingClientRect(),{width:img.naturalWidth,height:img.naturalHeight});
 Object.assign(demon.style,{left:g.left+'px',top:g.top+'px'});demon.style.setProperty('--demon-display-size',g.size+'px');
}
export function positionDemons(frame){for(const box of frame.querySelectorAll('.portrait:has(.demon-wrapper)'))positionDemon(box);}
