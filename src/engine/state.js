export const clone=value=>JSON.parse(JSON.stringify(value));
export const freshMeta=()=>({achievements:[],endings:[],quizCompleted:false,realisticUnlocked:false});
// Always allocate new per-run minigame storage. Loading an existing snapshot does not use this factory.
export const freshRun=(name,race,demon='DMN-NONE')=>({name,race,demon,initialDemon:demon,gg:0,items:{},knowledge:[],minigames:{},location:'LOC-001',flags:{'FLG-SKIP-F2':false,'FLG-SKIP-C3':false,'FLG-SKIP-D4':false,'FLG-RUN-DEMON-BETRAYED':false},counters:{'CTR-Y2-COMPLETE':0,'CTR-Y3-COMPLETE':0,'CTR-H-KNEEL':0},completed:{},seen:[],history:[],visit:{},event:null,node:null,line:0,ending:null,mode:'explore',pending:null,sceneCast:null});
export const createGame=()=>({run:null,meta:freshMeta(),quiz:null,checkpoints:{option:null,event:null,adventure:null},notices:[]});
