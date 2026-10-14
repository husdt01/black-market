'use strict';
window.SND=(function(){
let ctx=null,master=null,noiseBuf=null,amb=null;
const KEY='bm_sound';
const on=()=>{try{return localStorage.getItem(KEY)!=='0'}catch(e){return true}};

function init(){
  if(!ctx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    ctx=new AC();
    master=ctx.createGain();
    master.gain.setValueAtTime(0.0001,ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(.5,ctx.currentTime+.5);
    master.connect(ctx.destination);
  }
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return true;
}

/* буфер "коричневого" шума для фонового гула */
function noise(){
  if(noiseBuf)return noiseBuf;
  const len=ctx.sampleRate*2,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  let last=0;
  for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.2}
  noiseBuf=buf;return buf;
}

/* фоновая атмосфера: гул рынка */
function ambStart(){
  if(amb||!ctx)return;
  const src=ctx.createBufferSource();src.buffer=noise();src.loop=true;
  const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=190;
  const g=ctx.createGain();g.gain.setValueAtTime(0.0001,ctx.currentTime);
  g.gain.linearRampToValueAtTime(.045,ctx.currentTime+2.5);
  src.connect(f);f.connect(g);g.connect(master);src.start();
  const o=ctx.createOscillator();o.type='sine';o.frequency.value=52;
  const og=ctx.createGain();og.gain.value=.012;o.connect(og);og.connect(master);o.start();
  const lfo=ctx.createOscillator();lfo.frequency.value=.06;
  const lg=ctx.createGain();lg.gain.value=.018;lfo.connect(lg);lg.connect(g.gain);lfo.start();
  amb={src:src,o:o,lfo:lfo,g:g};
}
function ambStop(){
  if(!amb||!ctx)return;
  const n=amb;amb=null;const t=ctx.currentTime;
  n.g.gain.cancelScheduledValues(t);
  n.g.gain.setTargetAtTime(0.0001,t,.25);
  setTimeout(()=>{try{n.src.stop();n.o.stop();n.lfo.stop()}catch(e){}},800);
}

function tone(fr,d,o){
  o=o||{};if(!ctx)return;
  const t=ctx.currentTime+(o.at||0),os=ctx.createOscillator(),g=ctx.createGain(),v=o.v||.08;
  os.type=o.type||'sine';
  os.frequency.setValueAtTime(fr,t);
  if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(v,t+.006);
  g.gain.exponentialRampToValueAtTime(.0001,t+d);
  os.connect(g);g.connect(master);
  os.start(t);os.stop(t+d+.05);
}

const FX={
  click(){tone(1500,.035,{type:'square',v:.02})},
  tab(){tone(300,.07,{type:'triangle',v:.035,to:540});tone(900,.05,{v:.02,at:.05})},
  ping(){tone(880,.14,{v:.035})},
  open(){tone(240,.09,{type:'triangle',v:.04,to:430});tone(640,.07,{v:.025,at:.06})},
  close(){tone(430,.09,{type:'triangle',v:.04,to:230})},
  buy(){[520,780,1040].forEach((f,i)=>tone(f,.16,{type:'triangle',v:.07,at:i*.075}))},
  sell(){tone(1320,.07,{type:'square',v:.04});tone(1760,.22,{type:'square',v:.04,at:.07})},
  err(){tone(150,.12,{type:'square',v:.05});tone(150,.14,{type:'square',v:.05,at:.15})},
  rare(){[523,659,784,1047].forEach((f,i)=>tone(f,.4,{type:'triangle',v:.06,at:i*.09}))},
  stars(){[880,1174,1568,2093].forEach((f,i)=>tone(f,.28,{type:'triangle',v:.05,at:i*.08}))},
  raid(){for(let i=0;i<6;i++)tone(i%2?640:900,.24,{type:'sawtooth',v:.05,at:i*.26})},
  raidEnd(){tone(300,.5,{type:'triangle',v:.07,to:900})},
  fail(){tone(420,.5,{type:'sawtooth',v:.06,to:70})},
  craft(){tone(70,1.2,{type:'sawtooth',v:.06,to:420})},
  drop(){tone(190,.12,{type:'square',v:.05,to:90});tone(1200,.06,{v:.02,at:.1})}
};

function play(n){if(!on()||!FX[n])return;if(!init())return;try{FX[n]()}catch(e){}}
function set(v){
  try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}
  if(v){if(init()){ambStart();play('ping')}}
  else{ambStop()}
}
function unlock(){if(on()&&init())ambStart()}

/* iOS/Android: аудио разрешено только после жеста пользователя */
['pointerdown','keydown','touchend'].forEach(ev=>document.addEventListener(ev,unlock,true));

/* экономия батареи: пауза контекста когда приложение свёрнуто */
document.addEventListener('visibilitychange',()=>{
  if(!ctx)return;
  if(document.visibilityState==='hidden'){if(ctx.state==='running')ctx.suspend().catch(()=>{})}
  else if(on()){ctx.resume().catch(()=>{})}
});

/* автоматические UI-звуки */
document.addEventListener('click',e=>{
  if(!on())return;
  if(e.target.closest('.tab'))play('tab');
  else if(e.target.closest('.btn,.chip,.case-card,.sel-row'))play('click');
},true);

/* звуки открытия/закрытия модалок */
const mods=document.getElementById('modals');
if(mods&&window.MutationObserver){
  new MutationObserver(ms=>{
    ms.forEach(m=>{
      if(m.addedNodes.length)play('open');
      if(m.removedNodes.length)play('close');
    });
  }).observe(mods,{childList:true});
}

return{play:play,set:set,on:on,unlock:unlock};
})();
