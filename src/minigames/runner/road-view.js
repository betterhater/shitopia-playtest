// Alternating vertical reflection joins each original edge to itself.
// Three tiles cover the viewport; two-image-height wrap has identical pixels.
export const roadOffset=distance=>((distance%2)+2)%2;
export const roadTransform=distance=>`translateY(${roadOffset(distance)*100/3}%)`;
