// Explicit map hierarchy. Story links still determine which onward paths are legal.
export const parentHub={
 'LOC-001':'LOC-013','LOC-003':'LOC-013','LOC-004':'LOC-013',
 'LOC-005':'LOC-013','LOC-006':'LOC-013','LOC-007':'LOC-013','LOC-008':'LOC-013',
 'LOC-002':'LOC-014','LOC-009':'LOC-014','LOC-010':'LOC-014',
 'LOC-011':'LOC-014','LOC-012':'LOC-014'
};
export const isHub=id=>id==='LOC-013'||id==='LOC-014';
export const hubFor=id=>parentHub[id]||null;
export function onwardDestinations(location,destinations){
 return destinations.filter(d=>d.id!==hubFor(location)&&!isHub(d.id)&&!(location==='LOC-006'&&d.id==='LOC-007'));
}
