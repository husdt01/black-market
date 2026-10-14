'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>'₽ '+Math.round(n).toLocaleString('ru-RU');
const pct=c=>(c>=0?'+':'')+c.toFixed(2)+'%';
const left=s=>{s=Math.max(0,Math.floor(s));if(s>3600)return Math.floor(s/3600)+'ч '+Math.floor(s%3600/60)+'м';return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const RAR_RU={COMMON:'ОБЫЧНЫЙ',UNCOMMON:'НЕОБЫЧНЫЙ',RARE:'РЕДКИЙ',EPIC:'ЭПИЧЕСКИЙ',LEGENDARY:'ЛЕГЕНДАРНЫЙ',UNKNOWN:'НЕИЗВЕСТНО',RUNE:'РУНА'};
const CATS=[['ALL','ВСЕ'],['TECH','ТЕХНИКА'],['ARTIFACTS','АРТЕФАКТЫ'],['COLLECTIBLES','КОЛЛЕКЦИЯ'],['VEHICLES','ТРАНСПОРТ'],['DEVICES','УСТРОЙСТВА'],['WEAPON','ОРУЖИЕ'],['ARMOR','БРОНЯ'],['AMMO','ПАТРОНЫ'],['UNKNOWN','НЕИЗВЕСТНОЕ']];
const RCP={c3:{need:3,from:'COMMON',to:'UNCOMMON',chance:'85%',title:'3 × ОБЫЧНЫЙ → НЕОБЫЧНЫЙ'},e2:{need:2,from:'EPIC',to:'LEGENDARY',chance:'22%',title:'2 × ЭПИЧЕСКИЙ → ЛЕГЕНДАРНЫЙ'}};
const CASES={c50:{price:50000,name:'СТАЛЬНОЙ',t:1},c100:{price:100000,name:'ТЕНЕВОЙ',t:2},c150:{price:150000,name:'ОМЕГА',t:3},c500:{price:500000,name:'РУНА',t:4}};
const STAR_PKGS={p10:{stars:10,bal:50000},p25:{stars:25,bal:140000},p50:{stars:50,bal:300000},p100:{stars:100,bal:650000}};

// ===== КАТАЛОГ: ОРУЖИЕ / БРОНЯ / ПАТРОНЫ (фикс-цены, вне биржи) =====
const GEAR=[
  // ОРУЖИЕ
  {id:'W-01',cat:'WEAPON',rarity:'COMMON',name:'ПМ МАКАРОВА',price:18000,desc:'9×18 ПМ · 32 выстр/мин · магазин 8 · дальность 50 м'},
  {id:'W-02',cat:'WEAPON',rarity:'UNCOMMON',name:'АПС СТЕЧКИНА',price:26000,desc:'9×18 ПМ · 700 выстр/мин · магазин 20 · дальность 100 м'},
  {id:'W-03',cat:'WEAPON',rarity:'RARE',name:'АК-74М',price:45000,desc:'5.45×39 · 650 выстр/мин · магазин 30 · дальность 500 м'},
  {id:'W-04',cat:'WEAPON',rarity:'RARE',name:'КАРАБИН АК-104',price:52000,desc:'7.62×39 · 600 выстр/мин · магазин 30 · дальность 400 м'},
  {id:'W-05',cat:'WEAPON',rarity:'UNCOMMON',name:'САЙГА-12',price:35000,desc:'12/76 · 40 выстр/мин · магазин 8 · дальность 80 м'},
  {id:'W-06',cat:'WEAPON',rarity:'RARE',name:'ПП-19 ВИТЯЗЬ',price:55000,desc:'9×19 · 700 выстр/мин · магазин 30 · дальность 200 м'},
  {id:'W-07',cat:'WEAPON',rarity:'EPIC',name:'ВСС ВИНТОРЕЗ',price:120000,desc:'9×39 · 600 выстр/мин · магазин 20 · дальность 400 м · бесшумный'},
  {id:'W-08',cat:'WEAPON',rarity:'EPIC',name:'СВ-98',price:150000,desc:'7.62×54R · болт · магазин 10 · дальность 1000 м'},
  {id:'W-09',cat:'WEAPON',rarity:'LEGENDARY',name:'ПКМ ПЕЧЕНЕГ',price:220000,desc:'7.62×54R · 650 выстр/мин · лента 100 · дальность 1500 м'},
  // БРОНЯ
  {id:'A-01',cat:'ARMOR',rarity:'COMMON',name:'БАЛАКЛАВА «МАСКА-2»',price:6000,desc:'арамид · защита от осколков · обзор 90%'},
  {id:'A-02',cat:'ARMOR',rarity:'UNCOMMON',name:'ШЛЕМ 6Б47',price:30000,desc:'класс 2 · 1.0 кг · арамид · осколочный'},
  {id:'A-03',cat:'ARMOR',rarity:'UNCOMMON',name:'ВИЗОР «ЗАБРАЛО-6Ш»',price:22000,desc:'класс 2 · поликарбонат · противоосколочный'},
  {id:'A-04',cat:'ARMOR',rarity:'RARE',name:'БРОНЕЖИЛЕТ 6Б45',price:65000,desc:'класс 6 · 12 кг · керамика+арамид · полная защита'},
  {id:'A-05',cat:'ARMOR',rarity:'RARE',name:'БРОНЕЖИЛЕТ «КОРУНД-ВМ»',price:48000,desc:'класс 5 · 7.5 кг · стальные пластины · грудь+спина'},
  {id:'A-06',cat:'ARMOR',rarity:'EPIC',name:'ШЛЕМ «АЛТЫН»',price:95000,desc:'класс 3 · 3.5 кг · сталь + визор · штурмовой'},
  {id:'A-07',cat:'ARMOR',rarity:'RARE',name:'ПЛАСТИНА «ГРАНИТ-4»',price:18000,desc:'класс 6 · керамика · усиленный нагрудник'},
  {id:'A-08',cat:'ARMOR',rarity:'EPIC',name:'ЩИТ «ВАНТ-ВМ»',price:75000,desc:'класс 5 · 5.5 кг · смотровое окно · штурмовой'},
  // ПАТРОНЫ (ящиками)
  {id:'P-01',cat:'AMMO',rarity:'COMMON',name:'ЯЩИК 9×18 ПМ (250 шт)',price:6000,desc:'патроны ПМ/АПС · ящик 250 штук'},
  {id:'P-02',cat:'AMMO',rarity:'COMMON',name:'ЯЩИК 9×19 PARA (300 шт)',price:9000,desc:'патроны ВИТЯЗЬ · ящик 300 штук'},
  {id:'P-03',cat:'AMMO',rarity:'UNCOMMON',name:'ЯЩИК 5.45×39 ПС (240 шт)',price:12000,desc:'патроны АК-74 · ящик 240 штук'},
  {id:'P-04',cat:'AMMO',rarity:'UNCOMMON',name:'ЯЩИК 7.62×39 (200 шт)',price:14000,desc:'патроны АК-104/САЙГА · ящик 200 штук'},
  {id:'P-05',cat:'AMMO',rarity:'RARE',name:'ЯЩИК 7.62×54R (100 шт)',price:16000,desc:'патроны СВ-98/ПКМ · ящик 100 штук'},
  {id:'P-06',cat:'AMMO',rarity:'RARE',name:'ЯЩИК 9×39 СП-6 (60 шт)',price:21000,desc:'патроны ВСС · бронебойные · ящик 60 штук'},
  {id:'P-07',cat:'AMMO',rarity:'COMMON',name:'ЯЩИК 12/70 КАРТЕЧЬ (50 шт)',price:7000,desc:'патроны САЙГА-12 · картечь · ящик 50 штук'}
];

let S={bal:100000,inv:[],tx:[],user:'ГОСТЬ',rep:0,promo:[]};
let TG_ID='';
let ui={page:'market',cat:'ALL',open:null,convoy:false};
let notes=[],unread=0,entered=false;
let MARKET={products:[],tick:0,raid:{active:false,left:0}};
let AUCTIONS=[],CONTRACTS=[];
let raidWas=false,stateReady=false,promoDraft='';
let pollStarted=false;

async function api(path,method,body){
  const ctl=new AbortController();
  const to=setTimeout(()=>ctl.abort(),8000);
  try{
    const o={method:method||'GET',headers:{},signal:ctl.signal};
    if(TG_ID)o.headers['X-TG-ID']=TG_ID;
    if(body){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
    const r=await fetch(path,o);
    return await r.json();
  }catch(e){return{error:String(e)}}
  finally{clearTimeout(to)}
}

function badge(){const b=$('#badge');if(b){b.hidden=!unread;b.textContent=unread}}
function showNotification(t,m,k){
  notes.unshift({title:t,msg:m,t:Date.now()});unread++;badge();
  const box=$('#toasts');if(!box)return;
  const d=document.createElement('div');d.className='toast '+(k||'');
  d.innerHTML='<b>'+t+'</b><span>'+m+'</span>';
  box.prepend(d);
  while(box.children.length>4)box.lastChild.remove();
  setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},4000);
}
function modal(html){
  $$('.modal').forEach(m=>m.remove());
  const m=document.createElement('div');m.className='modal';
  m.innerHTML='<div class="sheet">'+html+'</div>';
  m.addEventListener('click',e=>{if(e.target===m)closeModal()});
  $('#modals').append(m);
  requestAnimationFrame(()=>m.classList.add('on'));
  return m;
}
function closeModal(){ui.open=null;const m=$('.modal');if(m){m.classList.remove('on');setTimeout(()=>m.remove(),250)}}

async function loadState(){
  if(!TG_ID)return;
  const d=await api('/api/state');
  if(d&&!d.error){
    const old=new Set(S.inv.map(x=>x.uid));
    S.bal=d.balance!=null?d.balance:100000;
    const st=d.state||{};S.inv=st.inv||[];S.tx=st.tx||[];S.rep=st.rep||0;S.promo=st.promo||[];
    if(d.username&&S.user==='ГОСТЬ')S.user=d.username;
    if(stateReady){S.inv.forEach(x=>{if(!old.has(x.uid)){showNotification('ПОСТАВКА',x.name+' поступил в инвентарь','up');SND.play('ping')}})}
    stateReady=true;
  }
}
async function loadMarket(){const d=await api('/api/market');if(d&&d.products){MARKET=d;raidCheck()}}
async function loadAuctions(){const d=await api('/api/auctions');if(d&&d.auctions)AUCTIONS=d.auctions}
async function loadContracts(){const d=await api('/api/contracts');if(d&&d.contracts)CONTRACTS=d.contracts}
async function refreshAll(){
  await Promise.all([loadMarket().catch(()=>{}),loadAuctions().catch(()=>{}),loadContracts().catch(()=>{}),loadState().catch(()=>{})]);
}

function raidCheck(){
  const r=MARKET.raid||{active:false,left:0};
  if(r.active&&!raidWas){SND.play('raid');showNotification('РЕЙД','Торги приостановлены, рынок заморожен','dn')}
  if(!r.active&&raidWas){SND.play('raidEnd');showNotification('РЕЙД ЗАВЕРШЁН','Цены обновлены после скачка','up')}
  raidWas=r.active;
  const el=$('#raid');if(el){el.classList.toggle('on',r.active)}
}

// === ФИКС ШАПКИ НА МОБИЛЬНЫХ ===
function fixHeader(){
  try{
    const bal=$('#bal');if(!bal)return;
    const bell=$('#bell');
    bal.style.whiteSpace='nowrap';
    let row=bal.parentElement;
    while(row&&row!==document.body&&!(bell?row.contains(bell):false))row=row.parentElement;
    if(!row||row===document.body)row=bal.parentElement.parentElement||bal.parentElement;
    if(!row)return;
    row.style.display='flex';row.style.alignItems='center';row.style.justifyContent='space-between';
    row.style.flexWrap='nowrap';row.style.gap='10px';
    const narrow=window.innerWidth<430;
    [...row.children].forEach((k,i)=>{
      k.style.minWidth='0';
      if(k.contains(bal)){
        k.style.flex='0 0 auto';k.style.whiteSpace='nowrap';k.style.textAlign='right';
        if(narrow){bal.style.fontSize='13px';const sb=k.querySelector('small');if(sb)sb.style.fontSize='8px'}
      }else if(bell&&k.contains(bell)){
        k.style.flex='0 0 auto';
      }else if(i===0){
        k.style.flex='0 1 auto';k.style.whiteSpace='nowrap';k.style.overflow='hidden';k.style.textOverflow='ellipsis';
        if(narrow){k.style.fontSize='12px';k.style.letterSpacing='.12em'}
      }else{
        k.style.flex='0 0 auto';k.style.whiteSpace='nowrap';
        if(narrow){k.style.fontSize='9px';k.style.letterSpacing='.1em'}
      }
    });
  }catch(e){}
}
let rsT=null;
window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(fixHeader,150)});

// === БЕЗОПАСНАЯ ОТРИСОВКА + WATCHDOG ===
function render(){
  const y=window.scrollY||0;
  try{
    $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.page===ui.page));
    if(ui.convoy)renderConvoy();
    else if(ui.page==='market')renderMarket();
    else if(ui.page==='auctions')renderAuctions();
    else if(ui.page==='contracts')renderContracts();
    else if(ui.page==='inventory')renderInventory();
    else if(ui.page==='craft')renderCraft();
    else renderProfile();
    hdr();
  }catch(e){
    console.error('RENDER FAIL',e);
    showNotification('СБОЙ ИНТЕРФЕЙСА',String(e&&e.message||e),'dn');
  }
  try{window.scrollTo(0,y)}catch(e){}
}
function watchdog(){
  [400,1200,3000,6000].forEach(ms=>setTimeout(()=>{
    if(!entered)return;
    const app=$('#app');
    if(app){app.classList.remove('hidden');if(app.style.display==='none')app.style.display=''}
    const ld=$('#loader');
    if(ld&&ms>=3000){try{ld.remove()}catch(e){}}
    const v=$('#view');
    if(v&&!v.innerHTML.trim())render();
  },ms));
}

// === ПОЛЛИНГ ===
function startPoll(){
  if(pollStarted)return;pollStarted=true;
  setInterval(async()=>{
    if(!entered)return;
    const ae=document.activeElement;
    const busy=ui.open||(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'));
    if(!busy){await refreshAll();render()}
    else hdr();
  },5000);
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&entered){refreshAll().then(()=>render())}
});
window.addEventListener('pageshow',()=>{if(entered)render()});

async function buyProduct(p){
  const pr=Math.round(p.price);
  if(S.bal<pr)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','Баланс слишком мал','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'buy',price:pr,item:{name:p.name,rarity:p.rarity,cat:p.cat,hue:Math.floor(Math.random()*360)}});
  if(r.ok){
    showNotification('ПОКУПКА ЗАВЕРШЕНА',p.name+' в инвентаре','up');
    SND.play(['EPIC','LEGENDARY','RUNE'].includes(p.rarity)?'rare':'buy');
    closeModal();await loadState();render();
  }else{showNotification('ОШИБКА',r.msg||'Покупка не удалась','dn');SND.play('err')}
}

// ===== ПОКУПКА СНАРЯЖЕНИЯ С КОЛИЧЕСТВОМ =====
async function buyGear(g,qty){
  qty=Math.max(1,Math.min(99,Math.round(qty)||1));
  const total=g.price*qty;
  if(S.bal<total)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','Нужно '+fmt(total),'dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'buy',price:total,qty:qty,item:{name:g.name,rarity:g.rarity,cat:g.cat,hue:Math.floor(Math.random()*360),desc:g.desc,gear:true}});
  if(r.ok){
    showNotification('ПОКУПКА ЗАВЕРШЕНА',g.name+' ×'+qty+' в инвентаре','up');
    SND.play(qty>1?'rare':'buy');
    closeModal();await loadState();render();
  }else{showNotification('ОШИБКА',r.msg||'Покупка не удалась','dn');SND.play('err')}
}
function confirmBuyGear(g){
  ui.open='gear';
  modal('<h4>ЗАКУПКА · '+g.name+'</h4>'+
    '<div class="line"><span>ТИП</span><b>'+(RAR_RU[g.rarity]||g.rarity)+'</b></div>'+
    '<div class="line"><span>ХАРАКТЕРИСТИКИ</span><b style="text-align:right;font-size:10px">'+g.desc+'</b></div>'+
    '<div class="line"><span>ЦЕНА ЗА 1 ШТ</span><b>'+fmt(g.price)+'</b></div>'+
    '<div class="line"><span>БАЛАНС</span><b>'+fmt(S.bal)+'</b></div>'+
    '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">КОЛИЧЕСТВО (1–99)</span>'+
    '<input class="inp" id="qty" type="number" min="1" max="99" value="1">'+
    '<div class="line" style="margin-top:10px"><span>ИТОГО</span><b id="qty-total" style="color:var(--grn)">'+fmt(g.price)+'</b></div>'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  const q=$('#qty');
  const upd=()=>{
    const n=Math.max(1,Math.min(99,+q.value||1));
    const t=$('#qty-total');if(t)t.textContent=fmt(g.price*n);
    const y=$('#m-yes');if(y)y.disabled=S.bal<g.price*n;
  };
  q.oninput=upd;upd();
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>buyGear(g,+q.value);
}
function openGear(id){
  const g=GEAR.find(x=>x.id===id);
  if(!g)return;
  ui.open=id;
  modal('<h4>'+g.name+'</h4>'+
    '<div class="line"><span>ID</span><b>'+g.id+'</b></div>'+
    '<div class="line"><span>ТИП</span><b>'+(RAR_RU[g.rarity]||g.rarity)+'</b></div>'+
    '<div class="line"><span>ХАРАКТЕРИСТИКИ</span><b style="text-align:right;font-size:10px">'+g.desc+'</b></div>'+
    '<div class="line"><span>ЦЕНА</span><b style="color:var(--grn)">'+fmt(g.price)+'</b></div>'+
    '<div class="line"><span>ЗАКУПКА</span><b>партиями 1–99 шт</b></div>'+
    '<div class="acts"><button class="btn" id="m-no">ЗАКРЫТЬ</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>confirmBuyGear(g);
}

async function sellProduct(uid,price){
  price=Math.round(price);
  if(!(price>0))return showNotification('НЕВЕРНАЯ ЦЕНА','Введите цену','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'sell',uid:uid,price:price});
  if(r.ok){showNotification('ПРОДАЖА ЗАВЕРШЕНА','Продано за '+fmt(price),'up');SND.play('sell');closeModal();await loadState();render()}
  else{showNotification('ОШИБКА',r.msg||'Продажа не удалась','dn');SND.play('err')}
}
async function sellModal(uid){
  const i=S.inv.find(x=>x.uid==uid);
  if(!i)return showNotification('ОШИБКА','Предмета нет','dn');
  ui.open='sell';
  if(i.rune){
    const val=i.val||i.bought||0;
    modal('<h4>ПРОДАЖА · '+i.name+'</h4>'+
      '<div class="line"><span>ТИП</span><b style="color:var(--amb)">КОЛЛЕКЦИОННАЯ РУНА</b></div>'+
      '<div class="line"><span>ФИКС-ЦЕНА</span><b>'+fmt(val)+'</b></div>'+
      '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">Руны продаются только по фиксированной стоимости, без влияния рынка.</span>'+
      '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">ПРОДАТЬ ЗА '+fmt(val)+'</button></div>');
    $('#m-no').onclick=closeModal;
    $('#m-yes').onclick=()=>sellProduct(uid,val);
  }else{
    const d=await api('/api/price?name='+encodeURIComponent(i.name));
    const val=Math.round(d&&d.price?d.price:(i.val||i.bought||0));
    modal('<h4>ПРОДАЖА · '+i.name+'</h4>'+
      '<div class="line"><span>РЫНОК СЕЙЧАС</span><b>'+fmt(val)+'</b></div>'+
      '<div class="line"><span>КУПЛЕНО ЗА</span><b>'+fmt(i.bought||0)+'</b></div>'+
      '<div class="line"><span>МАКС. ЦЕНА (+15%)</span><b>'+fmt(Math.round(val*1.15))+'</b></div>'+
      '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">ВАША ЦЕНА</span>'+
      '<input class="inp" id="ask" type="number" min="1" value="'+val+'">'+
      '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">ПРОДАТЬ</button></div>');
    $('#ask').oninput=()=>{const v=+$('#ask').value||0;$('#m-yes').disabled=(v>val*1.15||v<val*0.3)};
    $('#m-no').onclick=closeModal;
    $('#m-yes').onclick=()=>sellProduct(uid,+$('#ask').value);
  }
}
function confirmBuy(p){
  const pr=Math.round(p.price);
  modal('<h4>ПОДТВЕРЖДЕНИЕ ПОКУПКИ</h4><div class="line"><span>ПРЕДМЕТ</span><b>'+p.name+'</b></div>'+
    '<div class="line"><span>РЕДКОСТЬ</span><b>'+(RAR_RU[p.rarity]||p.rarity)+'</b></div>'+
    '<div class="line"><span>ЦЕНА</span><b>'+fmt(pr)+'</b></div>'+
    '<div class="line"><span>БАЛАНС</span><b>'+fmt(S.bal)+'</b></div>'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>buyProduct(p);
}
async function placeBid(auc,amount){
  amount=Math.round(amount);
  if(!(amount>0))return showNotification('ОШИБКА','Введите ставку','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'bid',auction_id:auc.id,amount:amount});
  if(r.ok){showNotification('СТАВКА ПРИНЯТА','Ставка '+fmt(amount),'up');SND.play('ping');closeModal();await loadState();await loadAuctions();render()}
  else{showNotification('ОШИБКА',r.msg||'Ставка не принята','dn');SND.play('err')}
}
function openAuction(a){
  ui.open=a.id;
  const minBid=a.bid+Math.max(100,Math.round(a.start*0.05));
  modal('<h4>АУКЦИОН · '+a.name+'</h4>'+
    '<div class="line"><span>РЕДКОСТЬ</span><b>'+(RAR_RU[a.rarity]||a.rarity)+'</b></div>'+
    '<div class="line"><span>ТЕКУЩАЯ СТАВКА</span><b style="color:var(--grn)">'+fmt(a.bid)+'</b></div>'+
    '<div class="line"><span>ЛИДЕР</span><b>'+(a.leader||'—')+'</b></div>'+
    '<div class="line"><span>СТАВОК</span><b>'+a.n+'</b></div>'+
    '<div class="line"><span>ОСТАЛОСЬ</span><b class="dn">'+left(a.left)+'</b></div>'+
    '<div class="line"><span>ПОЛУЧЕНИЕ</span><b>после завершения торгов</b></div>'+
    '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">ВАША СТАВКА (мин. '+fmt(minBid)+')</span>'+
    '<input class="inp" id="bid-amt" type="number" min="'+minBid+'" value="'+minBid+'">'+
    '<div class="acts"><button class="btn" id="m-no">ЗАКРЫТЬ</button><button class="btn pri" id="m-yes">СДЕЛАТЬ СТАВКУ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>placeBid(a,+$('#bid-amt').value);
}
function openProduct(id){
  const p=MARKET.products.find(x=>x.id===id);
  if(!p)return;
  ui.open=id;
  const c=((p.price/p.base)-1)*100;
  modal('<h4>'+p.name+'</h4>'+spark(p.hist,c>=0)+
    '<div class="line"><span>ID</span><b>'+p.id+'</b></div>'+
    '<div class="line"><span>РЕДКОСТЬ</span><b>'+(RAR_RU[p.rarity]||p.rarity)+'</b></div>'+
    '<div class="line"><span>ЦЕНА</span><b style="color:var(--grn)">'+fmt(p.price)+'</b></div>'+
    '<div class="line"><span>ИЗМЕНЕНИЕ</span><b class="'+(c>=0?'up':'dn')+'">'+pct(c)+'</b></div>'+
    '<div class="line"><span>ПРОДАВЕЦ</span><b>'+p.seller+'</b></div>'+
    '<div class="acts"><button class="btn" id="m-no">ЗАКРЫТЬ</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>confirmBuy(p);
}

async function ctAccept(id){
  const r=await api('/api/action','POST',{action:'ct-accept',id:id});
  if(r.ok){showNotification('КОНТРАКТ ПРИНЯТ','Найдите предмет и сдайте его в течение 10 минут','up');SND.play('ping');await loadContracts();render()}
  else showNotification('ОШИБКА',r.msg||'Контракт недоступен','dn');
}
async function ctDone(id){
  const r=await api('/api/action','POST',{action:'ct-done',id:id});
  if(r.ok){showNotification('КОНТРАКТ ВЫПОЛНЕН','+'+fmt(r.reward)+' и +'+r.rep+' репутации','up');SND.play('sell');await loadState();await loadContracts();render()}
  else{showNotification('НЕ ВЫШЛО',r.msg||'Ошибка','dn');SND.play('err')}
}
async function ctDrop(id){
  await api('/api/action','POST',{action:'ct-drop',id:id});
  showNotification('КОНТРАКТ СБРОШЕН','Предложение снова доступно другим');
  await loadContracts();render();
}

function craftModal(rid){
  const r=RCP[rid];
  const pool=S.inv.filter(x=>x.rarity===r.from&&!x.gear);
  if(pool.length<r.need)return showNotification('НЕ ХВАТАЕТ ПРЕДМЕТОВ','Нужно '+r.need+' шт. «'+RAR_RU[r.from]+'», у вас '+pool.length,'dn'),SND.play('err');
  ui.open='craft';
  const pre=pool.slice(0,r.need).map(x=>x.uid);
  modal('<h4>КРАФТ · '+r.title+'</h4>'+
    '<div class="line"><span>ШАНС УСПЕХА</span><b>'+r.chance+'</b></div>'+
    '<div class="line"><span>ПРИ ПРОВАЛЕ</span><b class="dn">предметы сгорают</b></div>'+
    '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">ВЫБЕРИТЕ '+r.need+' ПРЕДМЕТА(ОВ):</span>'+
    pool.map(x=>'<div class="sel-row '+(pre.includes(x.uid)?'on':'')+'" data-uid="'+x.uid+'"><b>'+x.name+'</b><span>'+fmt(x.val||x.bought)+'</span></div>').join('')+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">СОЗДАТЬ</button></div>');
  $$('.sel-row').forEach(el=>el.onclick=()=>{
    el.classList.toggle('on');
    if($$('.sel-row.on').length>r.need){el.classList.remove('on');SND.play('err')}else SND.play('click');
  });
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=async()=>{
    const uids=$$('.sel-row.on').map(el=>+el.dataset.uid);
    if(uids.length!==r.need)return showNotification('ВЫБЕРИТЕ РОВНО '+r.need,'Отметьте предметы','dn');
    SND.play('craft');
    const res=await api('/api/action','POST',{action:'craft',recipe:rid,uids:uids});
    if(res.ok&&res.res){showNotification('КРАФТ УСПЕШЕН','Получен: '+res.res,'up');SND.play('rare')}
    else if(res.ok){showNotification('ПРОВАЛ КРАФТА','Предметы сгорели','dn');SND.play('fail')}
    else showNotification('ОШИБКА',res.msg||'','dn');
    closeModal();await loadState();render();
  };
}

function spark(hist,up){
  if(!hist||hist.length<2)return'';
  const h=hist.slice(-40),mn=Math.min.apply(null,h),mx=Math.max.apply(null,h),rg=(mx-mn)||1;
  const pts=h.map((v,i)=>((i/(h.length-1))*100).toFixed(1)+','+(26-((v-mn)/rg)*24).toFixed(1)).join(' ');
  return '<svg viewBox="0 0 100 28" preserveAspectRatio="none" style="width:100%;height:34px;display:block;margin:8px 0;background:rgba(255,255,255,.02);border:1px solid var(--ln);border-radius:6px"><polyline points="'+pts+'" fill="none" stroke="'+(up?'#7ee08f':'#b8483f')+'" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
}

function caseModal(cid){
  const c=CASES[cid];
  ui.open='case';
  modal('<h4>КОНТЕЙНЕР · '+c.name+'</h4>'+
    '<div class="line"><span>ЦЕНА</span><b>'+fmt(c.price)+'</b></div>'+
    '<div class="line"><span>БАЛАНС</span><b>'+fmt(S.bal)+'</b></div>'+
    '<div class="line"><span>МУЛЬТИ-ДРОП</span><b>до 3 предметов</b></div>'+
    (cid==='c500'?'<div class="line"><span>ВНУТРИ</span><b style="color:#a06be0">СЕКРЕТНЫЕ РУНЫ · вне рынка</b></div>':'')+
    '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">Чем дороже контейнер — тем жирнее множитель стоимости и шанс нескольких предметов.</span>'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">ОТКРЫТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>openCase(cid);
}
async function openCase(cid){
  const c=CASES[cid];
  if(S.bal<c.price)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','Нужно '+fmt(c.price),'dn'),SND.play('err');
  closeModal();
  ui.open='case';
  modal('<h4>ВСКРЫТИЕ · '+c.name+'</h4><div class="case-box opening" id="cbox"><i></i><b></b></div><div style="text-align:center;color:var(--mut);font-size:11px;letter-spacing:.2em" id="cstat">ВСКРЫТИЕ...</div><div id="cdrops"></div>');
  SND.play('craft');
  const r=await api('/api/action','POST',{action:'open_case',case:cid});
  setTimeout(async()=>{
    const box=$('#cbox');if(box)box.style.display='none';
    const st=$('#cstat');if(st)st.textContent='ДОБЫЧА:';
    if(r.ok){
      $('#cdrops').innerHTML=r.drops.map((d,i)=>'<div class="drop-line r-'+d.rarity+'" style="animation-delay:'+(i*0.15)+'s"><b>'+d.name+'</b><span>'+(RAR_RU[d.rarity]||d.rarity)+' · x'+d.mult+'</span></div>').join('');
      const best=Math.max.apply(null,r.drops.map(d=>d.mult));
      if(best>=1.8||r.drops.length>1)SND.play('rare');else SND.play('buy');
      showNotification('КОНТЕЙНЕР ОТКРЫТ','Предметов: '+r.drops.length,'up');
      await loadState();
      hdr();
    }else{
      $('#cdrops').innerHTML='<div class="empty">'+(r.msg||'Ошибка')+'</div>';
      SND.play('err');
    }
    ui.open=null;
  },1000);
}

async function buyStars(pkg){
  if(!(window.Telegram&&window.Telegram.WebApp&&window.Telegram.WebApp.openInvoice))return showNotification('НЕДОСТУПНО','Оплата звёздами работает только в Telegram','dn');
  const r=await api('/api/stars/order','POST',{pkg:pkg});
  if(!r.ok)return showNotification('ОШИБКА',r.msg||'Не удалось создать счёт','dn');
  window.Telegram.WebApp.openInvoice(r.link,async(st)=>{
    if(st==='paid'){
      SND.play('stars');
      showNotification('ОПЛАТА ПРИНЯТА','Зачисление...','up');
      for(let i=0;i<4;i++){await new Promise(res=>setTimeout(res,1500));await loadState()}
      hdr();render();
      showNotification('БАЛАНС ПОПОЛНЕН','Звёзды зачислены на счёт','up');
    }else{
      showNotification('ОПЛАТА ОТМЕНЕНА','Счёт не оплачен','dn');
    }
  });
}

async function redeemPromo(){
  const inp=$('#promo-inp');
  const code=(inp?inp.value:'').trim().toUpperCase();
  if(!code)return showNotification('ОШИБКА','Введи ключ','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'promo',code:code});
  if(r.ok){
    let n=0;
    const scr=setInterval(()=>{
      if(!inp||!document.body.contains(inp)){clearInterval(scr);return}
      inp.value=code.split('').map((ch,i)=>i<n?ch:String.fromCharCode(33+Math.floor(Math.random()*60))).join('');
      n++;
      if(n>code.length)clearInterval(scr);
    },40);
    SND.play('rare');
    if(r.item){showNotification('ДОСТУП РАЗРЕШЁН','Получен артефакт: '+r.item,'up')}
    else{showNotification('ДОСТУП РАЗРЕШЁН','Ключ принят: +'+fmt(r.reward),'up')}
    promoDraft='';
    await loadState();
    render();
  }else{
    SND.play('err');
    showNotification('ДОСТУП ЗАПРЕЩЁН',r.msg||'','dn');
  }
}

function hdr(){const b=$('#bal');if(b)b.textContent=fmt(S.bal)}

function card(p){
  const c=((p.price/p.base)-1)*100;
  return '<article class="card r-'+p.rarity+'">'+
    '<div class="art"><i></i></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)"><span>'+(RAR_RU[p.rarity]||p.rarity)+'</span><span>'+p.id+'</span></div>'+
    '<h3>'+p.name+'</h3>'+spark(p.hist,c>=0)+
    '<div class="row"><span>Продавец</span><b>'+p.seller+'</b></div>'+
    '<div class="row"><span>Цена</span><b style="color:var(--grn)">'+fmt(p.price)+'</b></div>'+
    '<div class="row"><span>Изменение</span><b class="'+(c>=0?'up':'dn')+'">'+pct(c)+'</b></div>'+
    '<div class="ft"><button class="btn pri" data-buy="'+p.id+'">КУПИТЬ</button><button class="btn" data-view="'+p.id+'">ДЕТАЛИ</button></div>'+
    '</article>';
}
function gearCard(g){
  return '<article class="card r-'+g.rarity+'">'+
    '<div class="art"><i></i></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)"><span>'+(RAR_RU[g.rarity]||g.rarity)+'</span><span>'+g.id+'</span></div>'+
    '<h3>'+g.name+'</h3>'+
    '<div style="font-size:10px;color:var(--mut);font-family:var(--mono);letter-spacing:.05em;margin:2px 0 8px;line-height:1.5">'+g.desc+'</div>'+
    '<div class="row"><span>Цена за шт</span><b style="color:var(--grn)">'+fmt(g.price)+'</b></div>'+
    '<div class="row"><span>Закупка</span><b>партиями 1–99</b></div>'+
    '<div class="ft"><button class="btn pri" data-gbuy="'+g.id+'">КУПИТЬ</button><button class="btn" data-gview="'+g.id+'">ДЕТАЛИ</button></div>'+
    '</article>';
}
function renderGrid(){
  const g=$('#grid');if(!g)return;
  if(ui.cat==='WEAPON'||ui.cat==='ARMOR'||ui.cat==='AMMO'){
    const list=GEAR.filter(x=>x.cat===ui.cat);
    g.innerHTML=list.length?list.map(gearCard).join(''):'<div class="empty">НЕТ ЛОТОВ</div>';
    return;
  }
  let a=MARKET.products||[];
  if(ui.cat!=='ALL')a=a.filter(p=>p.cat===ui.cat);
  g.innerHTML=a.length?a.map(card).join(''):'<div class="empty">НЕТ ЛОТОВ</div>';
}
function renderMarket(){
  $('#view').innerHTML='<div class="convoy-bar"><button class="btn convoy-btn" data-convoy="open">⬢ КОНВОЙ</button><span class="convoy-hint">// защищённый транспорт</span></div>'+
    '<h2 class="pt">КОНТЕЙНЕРЫ</h2>'+
    '<div class="case-row">'+Object.keys(CASES).map(k=>{const c=CASES[k];
      return '<div class="case-card t'+c.t+'" data-case="'+k+'"><div class="case-ico"><i></i><b></b></div><h5>'+c.name+'</h5><small>мульти-дроп до 3</small><b class="cp">'+fmt(c.price)+'</b></div>';
    }).join('')+'</div>'+
    '<h2 class="pt">ОБЗОР РЫНКА</h2>'+
    '<div class="stats"><div class="stat"><small>ЛОТЫ</small><b>'+(MARKET.products||[]).length+'</b></div>'+
    '<div class="stat"><small>БАЛАНС</small><b>'+fmt(S.bal)+'</b></div>'+
    '<div class="stat"><small>ТИК</small><b>#'+(MARKET.tick||0)+'</b></div>'+
    '<div class="stat"><small>ИНВЕНТАРЬ</small><b>'+S.inv.length+'</b></div></div>'+
    '<div class="bar">'+CATS.map(c=>'<button class="chip '+(c[0]===ui.cat?'on':'')+'" data-cat="'+c[0]+'">'+c[1]+'</button>').join('')+'</div>'+
    '<div id="grid" class="grid"></div>';
  renderGrid();
}
function renderAuctions(){
  $('#view').innerHTML='<h2 class="pt">АУКЦИОНЫ · '+AUCTIONS.length+' АКТИВНЫХ</h2>'+
    '<div class="grid">'+(AUCTIONS.length?AUCTIONS.map(a=>{
      return '<article class="card r-'+a.rarity+'" data-auc="'+a.id+'">'+
        '<div class="art"><i></i></div><h3>'+a.name+'</h3>'+
        '<div class="row"><span>Редкость</span><b>'+(RAR_RU[a.rarity]||a.rarity)+'</b></div>'+
        '<div class="row"><span>Ставка</span><b style="color:var(--grn)">'+fmt(a.bid)+'</b></div>'+
        '<div class="row"><span>Лидер</span><b>'+(a.leader||'—')+'</b></div>'+
        '<div class="row"><span>Ставок</span><b>'+a.n+'</b></div>'+
        '<div class="row"><span>Осталось</span><b class="dn">'+left(a.left)+'</b></div></article>';
    }).join(''):'<div class="empty">АУКЦИОНОВ НЕТ</div>')+'</div>';
}
function renderContracts(){
  const open=CONTRACTS.filter(c=>c.st==='open');
  const mine=CONTRACTS.filter(c=>c.st==='acc');
  $('#view').innerHTML='<h2 class="pt">МОИ КОНТРАКТЫ · '+mine.length+'</h2>'+
    '<div class="grid">'+(mine.length?mine.map(c=>{
      const has=S.inv.some(x=>x.name===c.name);
      return '<article class="card r-'+c.rarity+'">'+
        '<div class="art"><i></i></div>'+
        '<div style="font-size:10px;color:var(--amb);letter-spacing:.15em">ЗАКАЗЧИК: '+c.npc+'</div>'+
        '<h3>'+c.name+'</h3>'+
        '<div class="row"><span>Награда</span><b style="color:var(--grn)">'+fmt(c.reward)+'</b></div>'+
        '<div class="row"><span>Репутация</span><b>+'+c.rep+'</b></div>'+
        '<div class="row"><span>Осталось</span><b class="dn">'+left(c.left)+'</b></div>'+
        '<div class="row"><span>Предмет у вас</span><b class="'+(has?'up':'dn')+'">'+(has?'ДА':'НЕТ')+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-ct-done="'+c.id+'" '+(has?'':'disabled')+'>СДАТЬ</button><button class="btn danger" data-ct-drop="'+c.id+'">СБРОС</button></div>'+
        '</article>';
    }).join(''):'<div class="empty">НЕТ АКТИВНЫХ КОНТРАКТОВ</div>')+'</div>'+
    '<h2 class="pt">ДОСТУПНЫЕ ЗАКАЗЫ · '+open.length+'</h2>'+
    '<div class="grid">'+(open.length?open.map(c=>{
      return '<article class="card r-'+c.rarity+'">'+
        '<div class="art"><i></i></div>'+
        '<div style="font-size:10px;color:var(--amb);letter-spacing:.15em">ЗАКАЗЧИК: '+c.npc+'</div>'+
        '<h3>'+c.name+'</h3>'+
        '<div class="row"><span>Награда</span><b style="color:var(--grn)">'+fmt(c.reward)+'</b></div>'+
        '<div class="row"><span>Репутация</span><b>+'+c.rep+'</b></div>'+
        '<div class="row"><span>Истекает</span><b>'+left(c.left)+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-ct-accept="'+c.id+'">ПРИНЯТЬ</button></div>'+
        '</article>';
    }).join(''):'<div class="empty">ЗАКАЗОВ НЕТ</div>')+'</div>';
}
function renderInventory(){
  $('#view').innerHTML='<h2 class="pt">МОЙ ИНВЕНТАРЬ · '+S.inv.length+'</h2><div class="grid">'+
    (S.inv.length?S.inv.map(i=>{
      const d=(i.val||i.bought)-(i.bought||0);
      return '<article class="card r-'+i.rarity+'"><div class="art"><i></i></div>'+
        '<h3>'+i.name+'</h3>'+
        (i.desc?'<div style="font-size:10px;color:var(--mut);font-family:var(--mono);letter-spacing:.05em;margin:-4px 0 8px;line-height:1.5">'+i.desc+'</div>':'')+
        '<div class="row"><span>Редкость</span><b>'+(RAR_RU[i.rarity]||i.rarity)+'</b></div>'+
        '<div class="row"><span>Куплено</span><b>'+fmt(i.bought||0)+'</b></div>'+
        '<div class="row"><span>Сейчас</span><b>'+fmt(i.val||i.bought||0)+'</b></div>'+
        '<div class="row"><span>П/У</span><b class="'+(d>=0?'up':'dn')+'">'+(d>=0?'+':'')+fmt(d)+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-sell="'+i.uid+'">ПРОДАТЬ</button></div></article>';
    }).join(''):'<div class="empty">ИНВЕНТАРЬ ПУСТ</div>')+'</div>';
}
function renderCraft(){
  $('#view').innerHTML='<h2 class="pt">КРАФТ · СИНТЕЗ ПРЕДМЕТОВ</h2>'+
    Object.keys(RCP).map(k=>{
      const r=RCP[k];
      const have=S.inv.filter(x=>x.rarity===r.from&&!x.gear).length;
      return '<div class="card" style="margin-bottom:12px">'+
        '<h3>'+r.title+'</h3>'+
        '<div class="row"><span>Шанс успеха</span><b class="up">'+r.chance+'</b></div>'+
        '<div class="row"><span>Материалов у вас</span><b>'+have+' / '+r.need+'</b></div>'+
        '<div class="row"><span>При провале</span><b class="dn">материалы сгорают</b></div>'+
        '<div class="ft"><button class="btn pri" data-craft="'+k+'" '+(have>=r.need?'':'disabled')+'>СОЗДАТЬ</button></div>'+
        '</div>';
    }).join('')+
    '<div class="empty" style="margin-top:12px">Материалы добываются на рынке и аукционах</div>';
}

// ===== КОНВОЙ / АНГАР =====
function renderConvoy(){
  $('#view').innerHTML=
    '<div class="convoy-top">'+
      '<button class="btn back-btn" data-convoy-back="1">← НАЗАД</button>'+
      '<b class="convoy-title">КОНВОЙ // АНГАР</b>'+
      '<span class="convoy-status">СТАТУС: ОЖИДАНИЕ</span>'+
    '</div>'+
    '<div class="hangar">'+
      '<div class="hangar-floor"></div>'+
      '<div class="hangar-grid">'+
        '<button class="slot s-top" data-cslot="top"><i></i><b>СЛОТ 01</b><small>верхний узел</small></button>'+
        '<button class="slot s-left" data-cslot="left"><i></i><b>СЛОТ 02</b><small>левый узел</small></button>'+
        '<button class="slot core" data-cslot="core"><i></i><b>ЯДРО</b><small>центральный узел</small></button>'+
        '<button class="slot s-right" data-cslot="right"><i></i><b>СЛОТ 03</b><small>правый узел</small></button>'+
        '<button class="slot s-bottom" data-cslot="bottom"><i></i><b>СЛОТ 04</b><small>нижний узел</small></button>'+
      '</div>'+
      '<div class="hangar-log" id="hangar-log">&gt; ангар законсервирован. модули не установлены.</div>'+
    '</div>';
  $$('.slot').forEach(el=>el.onclick=()=>{SND.play('click');convoySlot(el.dataset.cslot)});
}
function convoySlot(id){
  const names={top:'ВЕРХНИЙ УЗЕЛ',left:'ЛЕВЫЙ УЗЕЛ',right:'ПРАВЫЙ УЗЕЛ',bottom:'НИЖНИЙ УЗЕЛ',core:'ЯДРО КОНВОЯ'};
  const lg=$('#hangar-log');
  if(lg)lg.textContent='> запрос к узлу «'+(names[id]||id)+'»... отклонено: модуль не установлен.';
  showNotification('СЛОТ НЕ АКТИВЕН','Модуль «'+(names[id]||id)+'» появится в следующих обновлениях');
}

function renderProfile(){
  const worth=S.bal+S.inv.reduce((s,i)=>s+(i.val||i.bought||0),0);
  const profit=worth-100000;
  const sndOn=SND.on();
  $('#view').innerHTML='<h2 class="pt">ПРОФИЛЬ</h2>'+
    '<div class="pf-h"><div class="av"></div><div class="pf-n"><b>'+S.user+'</b><small>РЕПУТАЦИЯ: '+S.rep+'</small><small style="color:var(--mut);margin-top:3px">ID: '+TG_ID+'</small></div></div>'+
    '<div class="stats"><div class="stat"><small>СОСТОЯНИЕ</small><b>'+fmt(worth)+'</b></div>'+
    '<div class="stat"><small>ПРИБЫЛЬ</small><b class="'+(profit>=0?'up':'dn')+'">'+(profit>=0?'+':'')+fmt(profit)+'</b></div>'+
    '<div class="stat"><small>СДЕЛОК</small><b>'+S.tx.length+'</b></div>'+
    '<div class="stat"><small>ИНВЕНТАРЬ</small><b>'+S.inv.length+'</b></div></div>'+
    '<div class="ft" style="margin-bottom:14px"><button class="btn '+(sndOn?'pri':'')+'" id="snd-btn">ЗВУК: '+(sndOn?'ВКЛ':'ВЫКЛ')+'</button></div>'+
    '<h2 class="pt">ПОПОЛНЕНИЕ · TELEGRAM STARS</h2>'+
    '<div class="card" style="margin-bottom:14px">'+
    '<div style="font-size:10px;color:var(--amb);letter-spacing:.2em">ОПЛАТА ЗВЁЗДАМИ TELEGRAM</div>'+
    '<h3>БАЛАНС ЗА ЗВЁЗДЫ</h3>'+
    Object.keys(STAR_PKGS).map(k=>{const p=STAR_PKGS[k];
      return '<div class="line"><span>'+p.stars+' ★ → '+fmt(p.bal)+'</span><b><button class="btn pri" style="min-height:34px;padding:6px 14px" data-stars="'+k+'">КУПИТЬ</button></b></div>';
    }).join('')+
    '</div>'+
    '<h2 class="pt">ШИФР-КАНАЛ</h2>'+
    '<div class="card" style="margin-bottom:14px">'+
    '<div style="font-size:10px;color:var(--amb);letter-spacing:.2em">ДОСТУП // ЗАКРЫТЫЙ КАНАЛ</div>'+
    '<h3>ШИФР-КЛЮЧ</h3>'+
    '<input class="inp" id="promo-inp" placeholder="ВВЕДИ КЛЮЧ..." value="'+(promoDraft||'')+'" style="text-transform:uppercase;letter-spacing:.15em">'+
    '<div class="ft"><button class="btn pri" data-promo="1">ДЕШИФРОВАТЬ</button></div>'+
    ((S.promo||[]).length?'<div style="margin-top:10px">'+(S.promo||[]).map(p=>'<div class="line"><span>'+p+'</span><b class="up">АКТИВИРОВАН</b></div>').join('')+'</div>':'')+
    '</div>'+
    '<h2 class="pt">ПОСЛЕДНИЕ СДЕЛКИ</h2><div style="display:flex;flex-direction:column;gap:8px">'+
    (S.tx.slice(0,15).map(t=>'<div class="line"><span>'+new Date(t.t*1000).toLocaleTimeString('ru-RU')+' · '+t.type+'</span><b class="'+(t.amount>0?'up':t.amount<0?'dn':'')+'">'+(t.amount?(t.amount>0?'+':'-')+fmt(Math.abs(t.amount)):'—')+'</b></div>').join('')||'<div class="empty">НЕТ СДЕЛОК</div>')+'</div>';
  $('#snd-btn').onclick=()=>{SND.set(!SND.on());showNotification('ЗВУК',SND.on()?'Включён':'Выключен');render()};
  const pi=$('#promo-inp');
  if(pi)pi.oninput=e=>{promoDraft=e.target.value};
}

document.addEventListener('click',e=>{
  const tab=e.target.closest('.tab');
  if(tab){ui.page=tab.dataset.page;ui.convoy=false;render();return}
  const cat=e.target.closest('[data-cat]');
  if(cat){ui.cat=cat.dataset.cat;renderGrid();return}
  const buy=e.target.closest('[data-buy]');
  if(buy){const p=MARKET.products.find(x=>x.id===buy.dataset.buy);if(p)confirmBuy(p);return}
  const view=e.target.closest('[data-view]');
  if(view){openProduct(view.dataset.view);return}
  const gb=e.target.closest('[data-gbuy]');
  if(gb){const g=GEAR.find(x=>x.id===gb.dataset.gbuy);if(g)confirmBuyGear(g);return}
  const gv=e.target.closest('[data-gview]');
  if(gv){openGear(gv.dataset.gview);return}
  const auc=e.target.closest('[data-auc]');
  if(auc){const a=AUCTIONS.find(x=>x.id===auc.dataset.auc);if(a)openAuction(a);return}
  const sell=e.target.closest('[data-sell]');
  if(sell){sellModal(+sell.dataset.sell);return}
  const ca=e.target.closest('[data-ct-accept]');
  if(ca){ctAccept(ca.dataset.ctAccept);return}
  const cd=e.target.closest('[data-ct-done]');
  if(cd){ctDone(cd.dataset.ctDone);return}
  const cd2=e.target.closest('[data-ct-drop]');
  if(cd2){ctDrop(cd2.dataset.ctDrop);return}
  const cr=e.target.closest('[data-craft]');
  if(cr){craftModal(cr.dataset.craft);return}
  const cs=e.target.closest('[data-case]');
  if(cs){caseModal(cs.dataset.case);return}
  const stb=e.target.closest('[data-stars]');
  if(stb){buyStars(stb.dataset.stars);return}
  const pm=e.target.closest('[data-promo]');
  if(pm){redeemPromo();return}
  const cv=e.target.closest('[data-convoy]');
  if(cv){ui.convoy=true;SND.play('open');render();return}
  const bk=e.target.closest('[data-convoy-back]');
  if(bk){ui.convoy=false;SND.play('close');render();return}
  if(e.target.closest('#bell')){
    unread=0;badge();
    modal('<h4>УВЕДОМЛЕНИЯ</h4>'+(notes.slice(0,10).map(x=>'<div class="line"><span>'+x.title+'</span><b style="font-size:11px">'+x.msg+'</b></div>').join('')||'<div class="empty">ПУСТО</div>'));
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

// тик рейд-полосы
setInterval(()=>{
  const r=MARKET.raid||{active:false,left:0};
  const t=$('#rd-t'),bar=$('#rd-i');
  if(r.active){
    if(t)t.textContent='торги приостановлены · осталось '+Math.max(0,Math.floor(r.left))+' с';
    if(bar)bar.style.width=Math.max(0,Math.min(100,r.left/60*100))+'%';
  }
},1000);

// тик таймеров аукционов
setInterval(()=>{
  if(ui.page!=='auctions'||ui.open||ui.convoy)return;
  $$('[data-auc]').forEach(cardEl=>{
    const a=AUCTIONS.find(x=>x.id===cardEl.dataset.auc);
    if(!a)return;
    a.left=Math.max(0,(a.left||0)-1);
    const rows=cardEl.querySelectorAll('.row');
    const last=rows[rows.length-1];
    if(last){const b=last.querySelector('b');if(b)b.textContent=left(a.left)}
  });
},1000);

function enterApp(){
  if(entered)return;
  entered=true;
  const ld=$('#loader');
  if(ld){ld.style.opacity='0';ld.style.pointerEvents='none';setTimeout(()=>{try{ld.remove()}catch(e){}},800)}
  const app=$('#app');
  if(app){app.classList.remove('hidden');app.style.display=''}
  fixHeader();
  render();
  showNotification('ДОБРО ПОЖАЛОВАТЬ','Сессия открыта');
  watchdog();
}

function boot(){
  const lines=[
    'ИНИЦИАЛИЗАЦИЯ ТЕРМИНАЛА v2.7.1 ... [ OK ]',
    'ПОИСК ЗАЩИЩЁННОГО КАНАЛА ... [ OK ]',
    'РУКОПОЖАТИЕ AES-256 ... [ OK ]',
    'ПОДМЕНА DNS-УЗЛА ... [ OK ]',
    'АВТОРИЗАЦИЯ ПО ТОКЕНУ КАНАЛА ... [ OK ]',
    'ЗАГРУЗКА ТОРГОВЫХ МОДУЛЕЙ ... [ OK ]'
  ];
  const L=$('#ld-line');let i=0;
  (function nx(){
    if(L&&i<lines.length){L.innerHTML=(L.innerHTML?L.innerHTML+'<br>':'')+'<span>&gt; '+lines[i++]+'</span>';setTimeout(nx,430)}
    else{if(L)L.innerHTML=(L.innerHTML?L.innerHTML+'<br>':'')+'<span class="ok">&gt; КАНАЛ ГОТОВ. ДОБРО ПОЖАЛОВАТЬ В ТЕНЬ.</span>';const e=$('#enter');if(e)e.hidden=false;else setTimeout(enterApp,300)}
  })();
  refreshAll().then(()=>{if(entered)render()});
  const eb=$('#enter');
  if(eb)eb.addEventListener('click',enterApp);
  fixHeader();
  startPoll();
}

(function(){
  TG_ID='guest_'+(localStorage.getItem('bm_guest')||Math.random().toString(36).slice(2));
  localStorage.setItem('bm_guest',TG_ID);
  if(window.Telegram&&window.Telegram.WebApp){
    const tg=window.Telegram.WebApp;
    try{tg.ready();tg.expand()}catch(e){}
    const tu=tg.initDataUnsafe&&tg.initDataUnsafe.user;
    if(tu){const fn=((tu.first_name||'')+' '+(tu.last_name||'')).trim();if(fn)S.user=fn;else if(tu.username)S.user=tu.username}
    if(tg.initData){
      fetch('/api/tg/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:tg.initData})})
        .then(r=>r.json()).then(d=>{if(d&&d.valid){TG_ID=d.tg_id;loadState().catch(()=>{}).then(()=>{if(entered)render()})}}).catch(()=>{});
    }
  }
  boot();
})();
