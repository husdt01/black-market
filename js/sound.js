'use strict';
const SND=(function(){
let ctx=null,master=null;
const on=()=>localStorage.getItem('bm_sound')==='1';
function init(){
  if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    ctx=new AC();master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination)}
  if(ctx.state==='suspended')ctx.resume();
  return true}
function tone(f,d,o){o=o||{};if(!ctx)return;const t=ctx.currentTime+(o.at||0),os=ctx.createOscillator(),g=ctx.createGain(),v=o.v||.08;
  os.type=o.type||'sine';os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  os.connect(g);g.connect(master);os.start(t);os.stop(t+d+.05)}
const FX={
  click(){tone(1500,.035,{type:'square',v:.02})},
  ping(){tone(880,.14,{v:.035})},
  buy(){[520,780,1040].forEach((f,i)=>tone(f,.16,{type:'triangle',v:.07,at:i*.075}))},
  sell(){tone(1320,.07,{type:'square',v:.04});tone(1760,.22,{type:'square',v:.04,at:.07})},
  err(){tone(150,.12,{type:'square',v:.05});tone(150,.14,{type:'square',v:.05,at:.15})},
  rare(){[523,659,784,1047].forEach((f,i)=>tone(f,.4,{type:'triangle',v:.06,at:i*.09}))},
  raid(){for(let i=0;i<6;i++)tone(i%2?640:900,.24,{type:'sawtooth',v:.05,at:i*.26})},
  raidEnd(){tone(300,.5,{type:'triangle',v:.07,to:900})},
  fail(){tone(420,.5,{type:'sawtooth',v:.06,to:70})},
  craft(){tone(70,1.2,{type:'sawtooth',v:.06,to:420})}
};
function play(n){if(!on()||!FX[n])return;if(!init())return;try{FX[n]()}catch(e){}}
function set(v){localStorage.setItem('bm_sound',v?'1':'0');if(v)init()}
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>{if(on())init()},true));
document.addEventListener('click',e=>{if(e.target.closest('.btn,.chip,.tab'))play('click')},true);
return{play,set,on};
})();
