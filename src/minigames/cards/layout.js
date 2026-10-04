// Measured inner artwork rects in the supplied 1080×1920 battlefield.
// The rendered battlefield rect is the only coordinate origin.
export const BATTLEFIELD_LAYOUT={
 hud:{x:17,y:42,w:66,h:11},
 enemy:{CE:{x:6.35,y:20.45,w:14.25,h:15.2},L:{x:25.5,y:20.5,w:20.8,h:15},M:{x:50.3,y:20.5,w:20.8,h:15},R:{x:75,y:20.5,w:20.8,h:15}},
 player:{CE:{x:6.35,y:60.3,w:14.25,h:15.2},L:{x:25.5,y:60.3,w:20.8,h:15},M:{x:50.3,y:60.3,w:20.8,h:15},R:{x:75,y:60.3,w:20.8,h:15}}
};
export const rectStyle=({x,y,w,h})=>`left:${x}%;top:${y}%;width:${w}%;height:${h}%;`;
