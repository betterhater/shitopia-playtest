export class AudioManager{
 constructor(settings={volume:0.35,mute:false}){this.settings=settings;}
 click(){if(this.settings.mute||this.settings.volume<=0)return;try{this.context??=new (window.AudioContext||window.webkitAudioContext)();this.context.resume();const o=this.context.createOscillator(),g=this.context.createGain(),t=this.context.currentTime;o.type='sine';o.frequency.setValueAtTime(460,t);o.frequency.exponentialRampToValueAtTime(230,t+0.05);g.gain.setValueAtTime(this.settings.volume*0.045,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.065);o.connect(g);g.connect(this.context.destination);o.start(t);o.stop(t+0.07);}catch{/* Visual feedback remains available. */}}
}
