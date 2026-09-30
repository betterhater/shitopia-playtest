import {catalog} from './catalog.js';
export const graph={};
export const events={};
export const K=id=>({kn:'KNW-'+String(id).padStart(3,'0')});
export const I=id=>({item:'ITM-'+String(id).padStart(3,'0')});
export const F=id=>({flag:id});
export const D=id=>({done:'EVT-'+id});
export const S=id=>({seen:id});
export const not=c=>({not:c});
export const any=(...c)=>({any:c});
export const kn=(...ids)=>ids.map(id=>({type:'knowledge',id:'KNW-'+String(id).padStart(3,'0')}));
export const item=(id,amount=1)=>({type:'item',id:'ITM-'+String(id).padStart(3,'0'),amount});
export const gg=amount=>({type:'gg',amount});
export const flag=id=>({type:'flag',id});
export const counter=id=>({type:'counter',id});
export const seen=id=>({type:'seen',id});
export const ach=id=>({type:'achievement',id:'ACH-'+id});
export const end=id=>({type:'ending',id:id==='royal'?id:'END-'+id});
export const raw=id=>catalog.records[id]?.[0]?.text??'';
export function clean(text){return text.replace(/（[^）]*(?:獲得|失去|進入|事件結束|時開放|設定 FLG|消耗|支付|交付|可重新|可從|關閉選項|種族為|攜帶|追加文字|後開放|回到選項|時為此|跳過|所有種族|RAC=)[^）]*）/g,'').replace(/\([^)]*(?:屎魔種類)[^)]*\)/g,'{demon}').replace(/^＞\s*/, '').replace(/\n\s*選項[１２３４５６７８９一二三四五六七八九0-9][\s\S]*/,'').trim();}
function refs(prefix,from,to){return Array.from({length:to-from+1},(_,i)=>`NODE-${prefix}-${String(from+i).padStart(3,'0')}`);}
function lines(ids){return ids.flatMap(id=>clean(raw(id)).split('\n').map(text=>({source:id,text:text.replace(/^＞\s*/,'').trim()}))).filter(l=>l.text&&!/^(?:主要目[的標]：|可對話人物：|人物：)|^（|^↓$|^結局收集頁$/.test(l.text));}
export function node(id,ids=[],next=null,fx=[]){graph[id]={id,lines:lines(ids),next,effects:fx,sources:ids};return id;}
function seq(key,prefix,a,b,next=null,fx=[]){return node(key,refs(prefix,a,b),next,fx);}
export function choice(id,text,next,condition=null,fx=[],source=id,disabled=null){return {id,text,next,condition,effects:fx,source,disabled};}
export function opt(id,next,condition=null,fx=[]){return choice(id,clean(raw(id)).split('\n')[0].replace(/^選項[０-９0-9１２３４５６７８９一二三四五六七八九]+[：:\s]*/,''),next,condition,fx);}
export function menu(id,choices){graph[id]={id,lines:[],choices,effects:[],sources:choices.map(o=>o.source)};return id;}
function event(id,start,location,repeat=false){events['EVT-'+id]={id:'EVT-'+id,start,location,repeat};}
const done=id=>[{type:'complete',id:'EVT-'+id}];
const finish=(key,id,fx=[],location=null)=>{node(key,[],null,[...fx,...done(id)]);graph[key].returnLocation=location;};
const demonAny=not({demon:'DMN-NONE'});
const royalReq=[I(4),K(14),K(16),K(27)];
export {royalReq};

// A: every shared narrative segment is explicitly connected, including unnumbered subchoices.
event('A','A.open','LOC-001');seq('A.open','A',2,3,'A.demon');
node('A.demon');graph['A.demon'].branches=[{condition:{demon:'DMN-ENOKI'},next:'A.enoki'},{condition:{demon:'DMN-DRAGONFRUIT'},next:'A.fruit'},{condition:{demon:'DMN-CORN'},next:'A.corn'},{next:'A.menu'}];
seq('A.enoki','A',6,6,'A.appear');seq('A.fruit','A',7,7,'A.appear');seq('A.corn','A',8,8,'A.appear');seq('A.appear','A',9,12,'A.menu');
menu('A.menu',[opt('OPT-A-001','A.water'),opt('OPT-A-002','A.explore'),opt('OPT-A-003','A.wait')]);
seq('A.water','A',13,13,'A.waterChoice');menu('A.waterChoice',[choice('NODE-A-014:back','回頭','A.die',null,[],'NODE-A-014'),choice('NODE-A-014:cancel','放棄','A.menu',null,[],'NODE-A-014')]);
node('A.die',['NODE-A-014'],null,[end('ZB')]);graph['A.die'].lines=[{source:'NODE-A-014',text:'在強烈的水流中你的意識逐漸模糊，身化屎水已成必然。'}];
node('A.explore',[], 'A.find');graph['A.explore'].lines=[{source:'OPT-A-002',text:'在瀑布的聲音掩蓋下，仍能聽見一絲孩童嬉鬧的聲音。'}];menu('A.find',[choice('NODE-A-015:find','尋找','A.children',null,[],'NODE-A-015'),choice('NODE-A-015:cancel','放棄','A.menu',null,[],'NODE-A-015')]);
seq('A.wait','A',16,16,'A.menu');seq('A.children','A',17,18,'A.ghost',kn(2));
menu('A.ghost',[opt('OPT-A-004','A.notGhost'),choice('NODE-A-019:ask','屎鬼是什麼東西？','A.whatGhost',null,[],'NODE-A-019')]);
seq('A.notGhost','A',19,19,'A.ask');seq('A.whatGhost','A',20,20,'A.ask');seq('A.ask','A',21,23,'A.truth');menu('A.truth',[opt('OPT-A-005','A.lie'),opt('OPT-A-006','A.honest')]);seq('A.lie','A',24,25,'A.finish');seq('A.honest','A',26,30,'A.finish');finish('A.finish','A',kn(1),'LOC-013');

event('A2','A2.open','LOC-001',true);seq('A2.open','A2',2,2,'A2.menu');menu('A2.menu',[opt('OPT-A2-001','A2.drive'),opt('OPT-A2-002','A2.chat',K(4))]);seq('A2.drive','A2',3,4,'A2.end',kn(3));seq('A2.chat','A2',5,10,'A2.trade',kn(5));
menu('A2.trade',[opt('OPT-A2-003','A2.later'),choice('NODE-A2-011:candy','我有一些糖果！','A2.candy',I(2),[item(2,-1)],'NODE-A2-011'),opt('OPT-A2-004','A2.story',[K(8),K(48)]),opt('OPT-A2-005','A2.steal',{demon:'DMN-ENOKI'})]);seq('A2.later','A2',11,11,'A2.end');seq('A2.candy','A2',12,13,'A2.end',[item(3),...kn(6)]);seq('A2.story','A2',14,17,'A2.end',[item(1),...kn(7)]);seq('A2.steal','A2',18,22,'A2.end',[item(1),...kn(7)]);finish('A2.end','A2',[],'LOC-013');

event('B','B.open','LOC-012');seq('B.open','B',2,4,'B.menu');menu('B.menu',[opt('OPT-B-001','B.read'),opt('OPT-B-002','B.agree')]);seq('B.read','B',5,5,'B.menu',kn(50));seq('B.agree','B',6,6,'B.end',kn(50,8));finish('B.end','B');
event('B2','B2.open','LOC-012');seq('B2.open','B2',2,6,'B2.end',kn(48));finish('B2.end','B2');
event('B3','B3.open','LOC-012');seq('B3.open','B3',2,13,'B3.offer',kn(49));seq('B3.offer','B3',14,16,'B3.menu');menu('B3.menu',[opt('OPT-B3-001','B3.buy',{gg:1000},[gg(-1000),item(4)]),opt('OPT-B3-002','B3.end')]);finish('B3.buy','B3');finish('B3.end','B3');
event('E','E.open','LOC-005');seq('E.open','E',2,2,'E.menu');menu('E.menu',[opt('OPT-E-001','E.search'),opt('OPT-E-002','E.stela'),opt('OPT-E-003',null),opt('OPT-E-004','E.solve',[F('FLG-E-SEARCH'),F('FLG-E-STELA')])]);seq('E.search','E',3,3,'E.menu',[flag('FLG-E-SEARCH')]);seq('E.stela','E',4,4,'E.menu',[flag('FLG-E-STELA')]);seq('E.solve','E',5,5,'E.end',kn(18));finish('E.end','E');

event('C','C.open','LOC-003');seq('C.open','C',2,8,'C.end',kn(4));finish('C.end','C');
for(const [ev,fee] of [['C2',50],['C3',100]]){event(ev,ev+'.open','LOC-003',true);seq(ev+'.open',ev,2,2,ev+'.decks');menu(ev+'.decks',[opt('OPT-'+ev+'-001',ev+'.intro',[I(3),{gg:fee}],[gg(-fee)]),opt('OPT-'+ev+'-002',ev+'.intro',[I(1),{gg:fee}],[gg(-fee)])]);}
seq('C2.intro','C2',3,5,'C2.game');node('C2.game');graph['C2.game'].minigame='GAME-C2';seq('C2.win','C2',7,10,'C2.end',[...kn(11,13),gg(100)]);seq('C2.fail','C2',12,13,'C2.end');finish('C2.end','C2');
seq('C3.intro','C3',3,6,'C3.challenge');menu('C3.challenge',[opt('OPT-C3-003','C3.skip',{race:'RAC-SOUP'}),opt('OPT-C3-004','C3.normal')]);seq('C3.skip','C3',7,11,'C3.win',[flag('FLG-SKIP-C3')]);seq('C3.normal','C3',12,12,'C3.game');node('C3.game');graph['C3.game'].minigame='GAME-C3';seq('C3.win','C3',14,17,'C3.end',[...kn(14),gg(500)]);seq('C3.fail','C3',19,21,'C3.death');menu('C3.death',[opt('OPT-C3-005','C3.betray',demonAny),opt('OPT-C3-006','C3.die')]);seq('C3.betray','C3',22,22,'C3.end',[{type:'betray'}]);seq('C3.die','C3',23,23,null,[end('ZD')]);finish('C3.end','C3');

event('F','F.open','LOC-003');seq('F.open','F',2,4,'F.menu');menu('F.menu',[opt('OPT-F-001','F.yes'),opt('OPT-F-002','F.later')]);seq('F.yes','F',5,5,'F.enter',kn(15));node('F.enter',[],null,done('F'));graph['F.enter'].startEvent='EVT-F2';seq('F.later','F',6,6,'F.end',kn(15));finish('F.end','F');
event('F2','F2.open','LOC-004');seq('F2.open','F2',2,7,'F2.menu');menu('F2.menu',[opt('OPT-F2-001','F2.skip',{race:'RAC-DRGN'}),opt('OPT-F2-002','F2.game')]);seq('F2.skip','F2',8,10,'F2.reward',[flag('FLG-SKIP-F2')]);node('F2.game');graph['F2.game'].minigame='GAME-F2';node('F2.normal',[],'F2.reward');node('F2.true',[],'F2.reward',[item(14)]);node('F2.reward',[],'F2.report',[...kn(16),item(3)]);seq('F2.report','F2',13,13,'F2.end',[gg(100)]);graph['F2.report'].location='LOC-003';finish('F2.end','F2',[],'LOC-003');node('F2.fail',[],null);graph['F2.fail'].returnLocation='LOC-004';

event('D','D.open','LOC-007');seq('D.open','D',2,2,'D.menu',kn(23));menu('D.menu',[opt('OPT-D-001','D.now'),opt('OPT-D-002','D.end')]);node('D.now',[],null,done('D'));graph['D.now'].startEvent='EVT-D2';finish('D.end','D');
event('D2','D2.open','LOC-008');seq('D2.open','D2',2,2,'D2.menu');menu('D2.menu',[opt('OPT-D2-001','D2.branch'),opt('OPT-D2-002','D2.trunk'),opt('OPT-D2-003','D2.root',[K(17),K(20)]),choice('D2:leave','返回郊區',null)]);seq('D2.branch','D2',3,3,'D2.check',[seen('D2.branch')]);seq('D2.trunk','D2',4,4,'D2.check',[seen('D2.trunk')]);node('D2.check');graph['D2.check'].branches=[{condition:[S('D2.branch'),S('D2.trunk'),not([K(17),K(20)])],next:null},{next:'D2.menu'}];seq('D2.root','D2',6,9,'D2.face',[...kn(25),item(7)]);menu('D2.face',[opt('OPT-D2-004','D2.escape'),opt('OPT-D2-005','D2.ask')]);seq('D2.escape','D2',10,15,'D2.end',[item(7,-1),...kn(24,12),gg(100)]);seq('D2.ask','D2',16,17,'D2.standoff');menu('D2.standoff',[choice('NODE-D2-018:obey','照做，緩緩放下手裡的東西','D2.obey',null,[item(7,-1)],'NODE-D2-018'),choice('NODE-D2-023:refuse','拒絕，與神秘人保持對峙','D2.fire',null,[],'NODE-D2-023')]);seq('D2.obey','D2',19,21,null,[end('ZA')]);seq('D2.fire','D2',24,25,'D2.defense');menu('D2.defense',[choice('NODE-D2-026:summon','召喚屎魔抵擋','D2.summon',demonAny,[],'NODE-D2-026'),choice('NODE-D2-028:dodge','試圖閃避','D2.dodge',null,[],'NODE-D2-028'),choice('NODE-D2-030:defend','全力防禦','D2.defend',null,[],'NODE-D2-030')]);node('D2.summon');graph['D2.summon'].branches=[{condition:{demon:'DMN-DRAGONFRUIT'},next:'D2.block'},{next:'D2.sacrifice'}];seq('D2.block','D2',27,27,'D2.dogs');seq('D2.sacrifice','D2',27,27,'D2.dogs',[{type:'betray'}]);node('D2.dodge');graph['D2.dodge'].branches=[{condition:any({race:'RAC-STIC'},{race:'RAC-SOUP'}),next:'D2.dodged'},{next:'D2.burn'}];node('D2.defend');graph['D2.defend'].branches=[{condition:any({race:'RAC-DRGN'},{race:'RAC-SHPB'}),next:'D2.defended'},{next:'D2.burn'}];seq('D2.dodged','D2',29,29,'D2.dogs');seq('D2.defended','D2',31,31,'D2.dogs');node('D2.burn',[],null,[end('ZA')]);seq('D2.dogs','D2',32,33,'D2.dogsCheck');node('D2.dogsCheck');graph['D2.dogsCheck'].branches=[{condition:{demon:'DMN-DRAGONFRUIT'},next:'D2.counterMenu'},{condition:demonAny,next:'D2.dogsDemon'},{next:'D2.dogsAlone'}];menu('D2.counterMenu',[opt('OPT-D2-006','D2.counter')]);seq('D2.counter','D2',34,39,'D2.end',[item(7,-1),...kn(24,12),gg(100)]);seq('D2.dogsDemon','D2',40,40,'D2.eaten',[{type:'demon',id:'DMN-NONE'}]);seq('D2.dogsAlone','D2',41,41,'D2.eaten');seq('D2.eaten','D2',42,42,null,[end('ZC')]);finish('D2.end','D2',[],'LOC-006');

event('D3','D3.open','LOC-007');seq('D3.open','D3',2,10,'D3.end',[...kn(26),gg(100)]);finish('D3.end','D3',[],'LOC-006');
event('D4','D4.open','LOC-007');seq('D4.open','D4',2,13,'D4.march',[item(8)]);seq('D4.march','D4',14,21,'D4.menu');menu('D4.menu',[opt('OPT-D4-001','D4.skip',{race:'RAC-STIC'}),opt('OPT-D4-002','D4.game')]);seq('D4.skip','D4',22,23,'D4.success',[flag('FLG-SKIP-D4')]);node('D4.game');graph['D4.game'].minigame='GAME-D4';node('D4.fail',[],null,[end('Z')]);seq('D4.success','D4',27,34,'D4.branch',[item(8,-1)]);node('D4.branch');graph['D4.branch'].branches=[{condition:{counter:'CTR-Y2-COMPLETE',min:2},next:'D4.good'},{next:'D4.bad'}];seq('D4.bad','D4',36,52,'D4.badEnd',[...kn(27),flag('FLG-GUARD-DEAD')]);finish('D4.badEnd','D4',[],'LOC-006');seq('D4.good','D4',54,61,'D4.demon');node('D4.demon');graph['D4.demon'].branches=[{condition:{demon:'DMN-CORN'},next:'D4.corn'},{condition:{demon:'DMN-DRAGONFRUIT'},next:'D4.fruit'},{condition:{demon:'DMN-ENOKI'},next:'D4.enoki'},{next:'D4.victory'}];seq('D4.corn','D4',62,62,'D4.victory');seq('D4.fruit','D4',63,63,'D4.victory');seq('D4.enoki','D4',64,64,'D4.victory');seq('D4.victory','D4',65,68,'D4.goodEnd');finish('D4.goodEnd','D4',[...kn(28,27),item(6),flag('FLG-GUARD-ALIVE')],'LOC-006');

event('G','G.open','LOC-011');seq('G.open','G',2,11,'G.sword',kn(44));seq('G.sword','G',12,15,'G.end',[item(14,-1),item(5)]);finish('G.end','G');
event('H','H.open','LOC-009',true);seq('H.open','H',2,2,'H.menu');menu('H.menu',[opt('OPT-H-001','H.yes'),opt('OPT-H-002','H.no')]);seq('H.yes','H',3,3,'H.end',kn(31));finish('H.end','H');seq('H.no','H',4,21,null,[end('C')]);
event('I','I.open','LOC-007');seq('I.open','I',2,8,null,[...kn(22),end('D')]);
event('J','J.open','LOC-010');seq('J.open','J',2,27,null,[...kn(37),end('B')]);
for(const [id,pay,ctr,loc]of [['Y',30,null,'LOC-003'],['Y2',100,'CTR-Y2-COMPLETE','LOC-007'],['Y3',50,'CTR-Y3-COMPLETE','LOC-006']]){event(id,id+'.open',loc,true);node(id+'.open',[],id+'.end');graph[id+'.open'].lines=[{source:'NODE-'+id+'-002',text:raw('NODE-'+id+'-002')}];finish(id+'.end',id,[gg(pay),...(ctr?[counter(ctr)]:[])]);}
for(const id of ['Z','Z2','Z3']){event(id,id+'.open','LOC-005');seq(id+'.open',id,2,7,null,[end('royal')]);}

// Location interactions share the same runner as events, with stable source references.
export const interactions={};
function talk(id,ids,fx=[],condition=null,npc=null,next=null){node('talk:'+id,ids,next,fx);const r={id,text:clean(raw(id)).replace(/^選項[０-９0-9１２３４５６７８９一二三四五六七八九]+[：:\s]*/,''),node:'talk:'+id,condition,npc,source:id};return r;}
const range=(loc,a,b)=>refs('LOC-'+loc,a,b);
const enter=(id,ev,condition=null,npc=null)=>({id,text:clean(raw(id)).replace(/^＞?\s*選項[０-９0-9１２３４５６７８９一二三四五六七八九]+[：:\s]*/,''),event:'EVT-'+ev,condition,npc,source:id});
interactions['LOC-001']=[{id:'visit:A2',text:'小屎朋友們',event:'EVT-A2',npc:'NPC-003',condition:D('A'),source:'EVT-A2'}];
interactions['LOC-003']=[talk('OPT-LOC-003-001',range('003',3,3),kn(9),null,'NPC-005'),talk('OPT-LOC-003-002',range('003',4,4),kn(10),not(K(10)),'NPC-005'),talk('OPT-LOC-003-003',range('003',5,5),[],null,'NPC-005'),enter('OPT-LOC-003-004','C2',[K(4),any(I(1),I(3)),{gg:50}],'NPC-005'),enter('OPT-LOC-003-005','C3',[K(4),K(11),any(I(1),I(3)),{gg:100}],'NPC-005'),enter('OPT-LOC-003-006','Y',K(10),'NPC-005'),enter('OPT-LOC-003-007','F',[K(12),not(K(15))],'NPC-005'),enter('OPT-LOC-003-008','C',null,'NPC-004'),talk('OPT-LOC-003-009',range('003',8,8),[],null,'NPC-004')];
interactions['LOC-004']=[{id:'visit:F2',text:'與見習屎衛交談',event:'EVT-F2',condition:[K(15),not(D('F2'))],npc:'NPC-007',source:'EVT-F2'}];
interactions['LOC-005']=[enter('OPT-LOC-005-001','E',not(D('E'))),enter('OPT-LOC-005-002','Z',royalReq),enter('OPT-LOC-005-003','Z2',[...royalReq,I(5)]),enter('OPT-LOC-005-004','Z3',[...royalReq,I(6)]),talk('OPT-LOC-005-005',range('005',5,5),[],null,'NPC-019'),talk('OPT-LOC-005-006',range('005',6,6),kn(17),K(1),'NPC-019')];
const guards=[talk('OPT-LOC-006-001',range('006',2,2),[seen('OPT-LOC-006-001')],not(D('D4')),'NPC-009'),talk('OPT-LOC-006-002',range('006',3,3),kn(20),[K(19),K(17),not(D('D4'))],'NPC-009'),enter('OPT-LOC-006-003','D',[S('OPT-LOC-006-001'),not(K(23)),not(D('D4'))],'NPC-009'),enter('OPT-LOC-006-004','D3',[K(12),not(D('D3')),not(D('D4'))],'NPC-009'),{...enter('OPT-LOC-006-004','Y2',[K(12),D('D3'),any(not(D('D4')),K(28))],'NPC-009'),id:'OPT-LOC-006-004:repeat',text:'有什麼我能做的嗎，長官？'},enter('OPT-LOC-006-005','D4',[K(12),K(26),K(49),not(D('D4'))],'NPC-009')];
const farm=[talk('OPT-LOC-006-006',range('006',4,4),kn(21),null,'NPC-008'),talk('OPT-LOC-006-007',range('006',5,5),kn(9,51),null,'NPC-008'),talk('OPT-LOC-006-008',range('006',6,10),[],[K(21),K(51),not(S('OPT-LOC-006-008'))],'NPC-008','farm.start'),{id:'OPT-LOC-006-008:repeat',text:raw('NODE-Y3-002'),event:'EVT-Y3',source:'OPT-LOC-006-008',condition:[K(21),K(51),S('OPT-LOC-006-008')],npc:'NPC-008'},enter('OPT-LOC-006-009','I',{counter:'CTR-Y3-COMPLETE',min:2},'NPC-008')];node('farm.start');graph['farm.start'].startEvent='EVT-Y3';interactions['LOC-006']=[...guards,...farm];interactions['LOC-007']=[...guards];interactions['LOC-008']=[{id:'visit:D2',text:'調查枯樹',event:'EVT-D2',condition:[K(23),not(D('D2'))],source:'EVT-D2'}];
interactions['LOC-009']=[talk('OPT-LOC-009-001',range('009',2,2),[],null,'NPC-020'),talk('OPT-LOC-009-002',range('009',3,3),kn(29),null,'NPC-020'),talk('OPT-LOC-009-003',range('009',4,8),kn(30),null,'NPC-020'),talk('OPT-LOC-009-004',range('009',9,9),[],null,'NPC-013'),talk('OPT-LOC-009-005',range('009',10,10),[],null,'NPC-013'),talk('OPT-LOC-009-006',range('009',11,12),[counter('CTR-H-KNEEL')],null,'NPC-013'),enter('OPT-LOC-009-007','H',{counter:'CTR-H-KNEEL',min:2},'NPC-013')];
interactions['LOC-010']=[talk('OPT-LOC-010-001',range('010',2,2),[],null,'NPC-014','shop.open'),talk('OPT-LOC-010-002',range('010',13,13),[],null,'NPC-015'),talk('OPT-LOC-010-003',range('010',14,14),kn(35),null,'NPC-015'),talk('OPT-LOC-010-004',range('010',15,20),kn(36),K(35),'NPC-015'),enter('OPT-LOC-010-005','J',K(36),'NPC-015')];node('shop.open');graph['shop.open'].shop=true;
interactions['LOC-002']=[{id:'NODE-LOC-002-003:door',text:'緊鎖的門扉',node:'temple.door',source:'NODE-LOC-002-003'},talk('OPT-LOC-002-001',range('002',5,5),[...kn(38),seen('OPT-LOC-002-001')],null,'NPC-021'),talk('OPT-LOC-002-002',range('002',6,6),kn(39),S('OPT-LOC-002-001'),'NPC-021'),{id:'NODE-LOC-002-007:wall',text:'爬滿藤蔓的石牆',node:'temple.wall',target:'temple-wall',source:'NODE-LOC-002-007'}];node('temple.door',['NODE-LOC-002-004']);node('temple.wall',['NODE-LOC-002-007'],null,[seen('temple.hole')]);graph['temple.wall'].lines.shift();
interactions['LOC-011']=[{id:'NODE-LOC-011-001:statue',text:'覆著灰的雕像',node:'temple.statue',source:'NODE-LOC-011-001'},{id:'NODE-LOC-011-003:seat',text:'空蕩的劍座',node:'temple.seat',source:'NODE-LOC-011-003'},{id:'NODE-LOC-011-005:ask',text:'你怎麼進來的？',node:'temple.how',npc:'NPC-017',source:'NODE-LOC-011-005'},talk('OPT-LOC-011-001',range('011',9,9),[],K(40),'NPC-017'),talk('OPT-LOC-011-002',range('011',10,10),[],null,'NPC-017','temple.reply'),enter('OPT-LOC-011-005','G',[I(14),not(D('G'))],'NPC-017')];node('temple.statue',['NODE-LOC-011-002'],null,kn(40));node('temple.seat',['NODE-LOC-011-004']);node('temple.how',['NODE-LOC-011-006'],'temple.howCheck');node('temple.howCheck');graph['temple.howCheck'].branches=[{condition:S('OPT-LOC-002-002'),next:'temple.why'},{next:null}];node('temple.why',['NODE-LOC-011-007','NODE-LOC-011-008']);menu('temple.reply',[opt('OPT-LOC-011-003','temple.polite'),opt('OPT-LOC-011-004','temple.slap')]);node('temple.polite',range('011',11,15),null,kn(41,42));node('temple.slap',range('011',16,18),null,[...kn(43),{type:'visit',id:'monkAngry'}]);
interactions['LOC-012']=[talk('OPT-LOC-012-001',range('012',2,2),[],null,'NPC-018'),talk('OPT-LOC-012-002',range('012',3,3),[...kn(45),seen('library.shelf')]),talk('OPT-LOC-012-003',range('012',4,4),kn(46),S('library.shelf')),talk('OPT-LOC-012-004',range('012',5,5),kn(47),S('library.shelf')),enter('OPT-LOC-012-005','B',[S('library.shelf'),not(D('B'))]),enter('OPT-LOC-012-006','B2',[K(8),not(D('B2'))],'NPC-018'),enter('OPT-LOC-012-007','B3',[K(48),K(18),not(D('B3'))],'NPC-018'),talk('OPT-LOC-012-008',range('012',6,6),[gg(-1000),item(4)],[K(49),not(I(4)),{gg:1000}],'NPC-018'),talk('OPT-LOC-012-009',range('012',7,8),[item(4)],[K(49),not(I(4)),{demon:'DMN-CORN'}],'NPC-018')];
export const links={
 'LOC-013':['LOC-005','LOC-003','LOC-006','LOC-001','LOC-014'],
 'LOC-014':['LOC-012','LOC-009','LOC-010','LOC-002','LOC-013'],
 'LOC-001':['LOC-013'],'LOC-003':['LOC-013',{id:'LOC-004',condition:K(15)}],'LOC-004':['LOC-003'],
 'LOC-005':['LOC-013'],'LOC-006':['LOC-013','LOC-007',{id:'LOC-008',condition:K(23)}],
 'LOC-007':['LOC-006',{id:'LOC-008',condition:K(23)}],'LOC-008':['LOC-006'],
 'LOC-009':['LOC-014'],'LOC-010':['LOC-014'],'LOC-012':['LOC-014'],
 'LOC-002':['LOC-014',{id:'LOC-011',condition:S('temple.hole')}],'LOC-011':['LOC-002']
};

// Exact source lines that introduce linked events and the lower-city transition.
node('tavern.duelIntro',['NODE-LOC-003-007'],'tavern.duelStart');node('tavern.duelStart');graph['tavern.duelStart'].startEvent='EVT-C';
const duelInteraction=interactions['LOC-003'].find(o=>o.id==='OPT-LOC-003-008');delete duelInteraction.event;duelInteraction.node='tavern.duelIntro';
interactions['LOC-003'].find(o=>o.id==='OPT-LOC-003-004').text='我要參加大屎決鬥！';
interactions['LOC-003'].find(o=>o.id==='OPT-LOC-003-005').text='我要參加屎亡遊戲！';
graph['talk:OPT-LOC-010-004'].lines.push(...lines(['NODE-LOC-010-021']));graph['talk:OPT-LOC-010-004'].sources.push('NODE-LOC-010-021');
graph['A.finish'].next='A.arrival';node('A.arrival',[],null);graph['A.arrival'].lines=[{source:'NODE-A-032',text:'化糞池王國下城區'}];graph['A.arrival'].sources=['NODE-A-032'];graph['A.arrival'].transition=true;
// Work descriptions keep source wording but omit non-player-facing ID markup.
for(const id of ['Y2','Y3'])graph[id+'.open'].lines[0].text=graph[id+'.open'].lines[0].text.replace(/KNW-\d+｜/g,'');

// Awards fire after the displayed line is advanced, never on branch entry.
for(const [id,source,achievement]of [['D4.bad','NODE-D4-037','13X'],['D4.good','NODE-D4-055',14]]){const line=graph[id].lines.find(l=>l.source===source);if(!line)throw Error('Missing achievement dialogue '+source);line.after=[ach(achievement)];}

// 0.3 formal rulings: visibility is separate from unchanged ending prerequisites.
for(const [id,itemId]of [['OPT-LOC-005-003',5],['OPT-LOC-005-004',6]])interactions['LOC-005'].find(o=>o.id===id).displayCondition=I(itemId);
for(const id of ['OPT-LOC-010-004','OPT-LOC-010-005']){const o=interactions['LOC-010'].find(o=>o.id===id);o.displayCondition=o.condition;}
const rootOption=graph['D2.menu'].choices.find(o=>o.id==='OPT-D2-003');
rootOption.condition=[S('D2.trunk'),...rootOption.condition];rootOption.displayCondition=S('D2.trunk');
const merchant=graph['talk:OPT-LOC-010-001'];
merchant.lines.unshift({source:'OPT-LOC-010-001',text:'用戶名：「你這裡有賣什麼？」'});

