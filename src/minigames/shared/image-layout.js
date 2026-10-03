// Rectangles are relative to the actual object-fit:contain image, never the modal.
export function containedImageRect(box,naturalWidth,naturalHeight){const scale=Math.min(box.width/naturalWidth,box.height/naturalHeight),width=naturalWidth*scale,height=naturalHeight*scale;return {left:(box.width-width)/2,top:(box.height-height)/2,width,height};}
export function safeAreaRect(image,area){return {left:image.left+image.width*area.x,top:image.top+image.height*area.y,width:image.width*area.width,height:image.height*area.height};}
export const PAPER_SAFE_AREAS={noteTop:{x:.06,y:.16,width:.88,height:.53},noteBottom:{x:.06,y:.50,width:.88,height:.41}};
export const PAPER_LINE_HEIGHT=1.7;
// Metrics are widths at 1px, including the six bold clue glyphs. Both pages use the smaller maximum.
export function sharedPaperLayout(image,metrics){const maxima={},areas={};for(const type of ['noteTop','noteBottom']){const area=areas[type]=safeAreaRect(image,PAPER_SAFE_AREAS[type]);maxima[type]=Math.min((area.width-1)/Math.max(...metrics[type]),(area.height-1)/(metrics[type].length*PAPER_LINE_HEIGHT));}return {areas,maxima,fontSize:Math.min(maxima.noteTop,maxima.noteBottom)};}
export const LEFT_PAGE_SAFE_AREA={x:.075,y:.125,width:.38,height:.76};
export const RIGHT_PAGE_SAFE_AREA={x:.545,y:.125,width:.38,height:.76};
export const INVENTORY_CENTERS=[.128,.278,.428,.578,.728,.876];
export function positionArea(node,rect){Object.assign(node.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});}
export function bindImageAreas(stage,image,areas,after=()=>{}){const fit=()=>{if(!stage.isConnected||!image.naturalWidth)return;const rect=containedImageRect({width:stage.clientWidth,height:stage.clientHeight},image.naturalWidth,image.naturalHeight);for(const [node,area]of areas)positionArea(node,safeAreaRect(rect,area));after();};image.addEventListener('load',fit);const observer=new ResizeObserver(fit);observer.observe(stage);requestAnimationFrame(fit);return ()=>{observer.disconnect();image.removeEventListener('load',fit);};}
