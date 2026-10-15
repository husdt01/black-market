'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>'₽ '+Math.round(n).toLocaleString('ru-RU');
const pct=c=>(c>=0?'+':'')+c.toFixed(2)+'%';
const left=s=>{s=Math.max(0,Math.floor(s));if(s>3600)return Math.floor(s/3600)+'ч '+Math.floor(s%3600/60)+'м';return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const RAR_RU={COMMON:'ОБЫЧНЫЙ',UNCOMMON:'НЕОБЫЧНЫЙ',RARE:'РЕДКИЙ',EPIC:'ЭПИЧЕСКИЙ',LEGENDARY:'ЛЕГЕНДАРНЫЙ',UNKNOWN:'НЕИЗВЕСТНО',RUNE:'РУНА'};
const CATS=[['ALL','ВСЕ'],['TECH','ТЕХНИКА'],['ARTIFACTS','АРТЕФАКТЫ'],['COLLECTIBLES','КОЛЛЕКЦИЯ'],['VEHICLES','ТРАНСПОРТ'],['DEVICES','УСТРОЙСТВА'],['WEAPON','ОРУЖИЕ'],['ARMOR','БРОНЯ'],['AMMO','ПАТРОНЫ'],['MERC','НАЁМНИКИ'],['UNKNOWN','НЕИЗВЕСТНОЕ']];
const RCP={c3:{need:3,from:'COMMON',to:'UNCOMMON',chance:'85%',title:'3 × ОБЫЧНЫЙ → НЕОБЫЧНЫЙ'},e2:{need:2,from:'EPIC',to:'LEGENDARY',chance:'22%',title:'2 × ЭПИЧЕСКИЙ → ЛЕГЕНДАРНЫЙ'}};
const CASES={c50:{price:50000,name:'СТАЛЬНОЙ',t:1},c100:{price:100000,name:'ТЕНЕВОЙ',t:2},c150:{price:150000,name:'ОМЕГА',t:3},c500:{price:500000,name:'РУНА',t:4}};
const STAR_PKGS={p10:{stars:10,bal:50000},p25:{stars:25,bal:140000},p50:{stars:50,bal:300000},p100:{stars:100,bal:650000}};

// ===== КАТАЛОГ =====
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
  // ПАТРОНЫ (ящиками, rounds = штук в ящике)
  {id:'P-01',cat:'AMMO',rarity:'COMMON',name:'ЯЩИК 9×18 ПМ (250 шт)',price:6000,rounds:250,desc:'патроны ПМ/АПС · ящик 250 штук'},
  {id:'P-02',cat:'AMMO',rarity:'COMMON',name:'ЯЩИК 9×19 PARA (300 шт)',price:9000,rounds:300,desc:'патроны ВИТЯЗЬ · ящик 300 штук'},
  {id:'P-03',cat:'AMMO',rarity:'UNCOMMON',name:'ЯЩИК 5.45×39 ПС (240 шт)',price:12000,rounds:240,desc:'патроны АК-74 · ящик 240 штук'},
  {id:'P-04',cat:'AMMO',rarity:'UNCOMMON',name:'ЯЩИК 7.62×39 (200 шт)',price:14000,rounds:200,desc:'патроны АК-104/САЙГА · ящик 200 штук'},
  {id:'P-05',cat:'AMMO',rarity:'RARE',name:'ЯЩИК 7.62×54R (100 шт)',price:16000,rounds:100,desc:'патроны СВ-98/ПКМ · ящик 100 штук'},
  {id:'P-06',cat:'AMMO',rarity:'RARE',name:'ЯЩИК 9×39 СП-6 (60 шт)',price:21000,rounds:60,desc:'патроны ВСС · бронебойные · ящик 60 штук'},
  {id:'P-07',cat:'AMMO',rarity:'COMMON',name:'ЯЩИК 12/70 КАРТЕЧЬ (50 шт)',price:7000,rounds:50,desc:'патроны САЙГА-12 · картечь · ящик 50 штук'},
  // ТРАНСПОРТ
  {id:'V-01',cat:'VEHICLES',rarity:'RARE',name:'«ТИГР» ГАЗ-233036',price:180000,desc:'броневик · класс 3 · 8 мест · 220 км/ч · решётки на стёклах'},
  {id:'V-02',cat:'VEHICLES',rarity:'EPIC',name:'БТР-80 «ВЕКТОР»',price:320000,desc:'БТР · класс 5 · десант 8 · амфибия · термодым'},
  {id:'V-03',cat:'VEHICLES',rarity:'EPIC',name:'КАМАЗ «ТАЙФУН»',price:260000,desc:'бронегрузовик · класс 4 · кузов 14 паллет · усиленные шины'},
  {id:'V-04',cat:'VEHICLES',rarity:'LEGENDARY',name:'БМП-2 «ГРОМ»',price:450000,desc:'БМП · класс 6 · 30 мм · десантный отсек на 8'},
  {id:'V-05',cat:'VEHICLES',rarity:'RARE',name:'УРАЛ-ВВ «ПЕРИМЕТР»',price:210000,desc:'бронегрузовик · класс 4 · 10 мест · усиленная кабина'},
  {id:'V-06',cat:'VEHICLES',rarity:'UNCOMMON',name:'ФУРГОН «ФЕРМЕР»',price:22000,desc:'грузовой фургон · без брони · 12 м³ · документы чистые'},
  {id:'V-07',cat:'VEHICLES',rarity:'UNCOMMON',name:'УАЗ «БУХАНКА»',price:30000,desc:'укреплённый · внедорожный · 4 места · кузов переварен'},
  // НАЁМНИКИ
  {id:'M-01',cat:'MERC',rarity:'RARE',name:'ПОЗЫВНОЙ «ГРИФ»',price:65000,desc:'роль: штурмовик · входит первым · 12 выходов · вопросов не задаёт'},
  {id:'M-02',cat:'MERC',rarity:'EPIC',name:'ПОЗЫВНОЙ «КОЩЕЙ»',price:120000,desc:'роль: взломщик · замки и сейфы · стаж 14 лет · без следов'},
  {id:'M-03',cat:'MERC',rarity:'UNCOMMON',name:'ПОЗЫВНОЙ «РТУТЬ»',price:40000,desc:'роль: водитель · уход с точки · водит всё что ездит'},
  {id:'M-04',cat:'MERC',rarity:'RARE',name:'ПОЗЫВНОЙ «ШУМ»',price:70000,desc:'роль: тяжёлый · подавление · держит голову под огнём'},
  {id:'M-05',cat:'MERC',rarity:'UNCOMMON',name:'ПОЗЫВНОЙ «ФЕЛИН»',price:45000,desc:'роль: разведка · маршруты и графики · остаётся незамеченным'},
  {id:'M-06',cat:'MERC',rarity:'RARE',name:'ПОЗЫВНОЙ «ВОРОН»',price:60000,desc:'роль: дроновод · глаза сверху · радиус 3 км'},
  {id:'M-07',cat:'MERC',rarity:'UNCOMMON',name:'ПОЗЫВНОЙ «СОМА»',price:38000,desc:'роль: медик · полевая хирургия · держит отряд на ходу'},
  {id:'M-08',cat:'MERC',rarity:'EPIC',name:'ПОЗЫВНОЙ «КАПКАН»',price:85000,desc:'роль: периметр · ловушки и датчики · никто не зайдёт со спины'},
  {id:'M-09',cat:'MERC',rarity:'LEGENDARY',name:'ПОЗЫВНОЙ «БЕС»',price:150000,desc:'роль: фиксер · договаривается, решает, исчезает первым'}
];

// ===== УЗЛЫ КОНВОЯ =====
const CV_SLOTS={
  top:{label:'ВЕРХНИЙ УЗЕЛ',accept:'MERC',hint:'экипаж'},
  left:{label:'ЛЕВЫЙ УЗЕЛ',accept:'WEAPON',hint:'оружие'},
  core:{label:'ЯДРО',accept:'VEHICLES',hint:'транспорт'},
  right:{label:'ПРАВЫЙ УЗЕЛ',accept:'AMMO',hint:'патроны'},
  bottom:{label:'НИЖНИЙ УЗЕЛ',accept:'ARMOR',hint:'броня'}
};
const CREW_MIN=5;
let CONVOY={core:null,left:null,right:null,bottom:null,top:[]};
let cvLog='';
function cvSave(){try{localStorage.setItem('bm_convoy_'+TG_ID,JSON.stringify(CONVOY))}catch(e){}}
function cvLoad(){
  try{
    const d=JSON.parse(localStorage.getItem('bm_convoy_'+TG_ID)||'{}');
    CONVOY=Object.assign({core:null,left:null,right:null,bottom:null,top:[]},d);
    if(!Array.isArray(CONVOY.top))CONVOY.top=CONVOY.top?[CONVOY.top]:[];
  }catch(e){CONVOY={core:null,left:null,right:null,bottom:null,top:[]}}
}
function cvCrew(){return (CONVOY.top||[]).map(uid=>S.inv.find(x=>x.uid===uid)).filter(Boolean)}
function cvItem(slot){
  if(slot==='top')return null;
  const uid=CONVOY[slot];if(!uid)return null;
  return S.inv.find(x=>x.uid===uid)||null;
}
function cvUids(){
  const set=new Set([CONVOY.core,CONVOY.left,CONVOY.right,CONVOY.bottom].filter(Boolean));
  (CONVOY.top||[]).forEach(u=>set.add(u));
  return set;
}

// ===== ОГРАБЛЕНИЯ: СКЛАДЫ И ШАНСЫ =====
const RW={COMMON:1,UNCOMMON:2,RARE:3,EPIC:4,LEGENDARY:5,RUNE:6,UNKNOWN:3};
const MIN_SCORE=60,MAX_SCORE=180;
const WAREHOUSES=[
  {id:'WH1',tier:1,name:'СКЛАД «ПАТРОННЫЙ»',type:'AMMO',timer:45,min:38,max:95,
   desc:'тыловой склад боеприпасов · охрана 4 чел · слабые решётки · добыча: ящики патронов',
   loot:{pool:'GEAR',cat:'AMMO',count:6}},
  {id:'WH2',tier:2,name:'СКЛАД «БРОНЯ»',type:'ARMOR',timer:60,min:30,max:93,
   desc:'склад средств защиты · охрана 6 чел · датчики движения · добыча: броня и шлемы',
   loot:{pool:'GEAR',cat:'ARMOR',count:5}},
  {id:'WH3',tier:3,name:'АРСЕНАЛ «ЧЁРНЫЙ»',type:'WEAPON',timer:75,min:22,max:90,
   desc:'арсенал стволов · охрана 9 чел · вооружены · камеры по периметру · добыча: 7 из 9 стволов',
   loot:{pool:'GEAR',cat:'WEAPON',count:7}},
  {id:'WH4',tier:4,name:'ХРАНИЛИЩЕ «РЕЛИКТ»',type:'ARTIFACTS',timer:90,min:14,max:85,
   desc:'частное хранилище артефактов · ЧОП · прямая сигнализация · добыча: 5 артефактов',
   loot:{pool:'MARKET',cat:'ARTIFACTS',count:5}},
  {id:'WH5',tier:5,name:'ВОЕННАЯ ЗОНА 51',type:'MILITARY',timer:150,min:0.0000001,max:9,
   desc:'военный объект · гарнизон 120 чел · ПВО · протокол поражения без предупреждения · добыча: 10 позиций элиты',
   loot:{pool:'ELITE',count:10}},
  {id:'WH6',tier:6,name:'АВТОБАЗА «ВЕКТОР»',type:'VEHICLES',locked:true,timer:0,min:0,max:0,
   desc:'стоянка бронетранспорта · периметр под током · МОДУЛЬ АВТОУГОНА В РАЗРАБОТКЕ',loot:null}
];
function convoyScore(){
  const crew=cvCrew();
  let sc=crew.length*3;
  crew.forEach(m=>{sc+=(RW[m.rarity]||1)*2});
  const v=cvItem('core'),w=cvItem('left'),a=cvItem('bottom'),am=cvItem('right');
  if(v)sc+=(RW[v.rarity]||1)*8;
  if(w)sc+=(RW[w.rarity]||1)*5;
  if(a)sc+=(RW[a.rarity]||1)*4;
  if(am)sc+=(RW[am.rarity]||1)*3;
  return sc;
}
function heistChance(wh){
  if(wh.locked)return 0;
  const sc=convoyScore();
  const t=Math.max(0,Math.min(1,(sc-MIN_SCORE)/(MAX_SCORE-MIN_SCORE)));
  return Math.min(95,wh.min+(wh.max-wh.min)*t);
}
function fmtChance(ch){
  if(ch<=0)return '0%';
  if(ch<0.01)return ch.toExponential(1)+'%';
  if(ch<1)return ch.toFixed(4)+'%';
  return ch.toFixed(1)+'%';
}
function convoyReady(){
  return !!(cvItem('core')&&cvItem('left')&&cvItem('right')&&cvItem('bottom')&&cvCrew().length>=CREW_MIN);
}
function sample(arr,n,allowDup){
  const out=[];const pool=arr.slice();
  for(let i=0;i<n;i++){
    if(!pool.length){
      if(!allowDup)break;
      arr.forEach(x=>pool.push(x));
    }
    out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  }
  return out;
}
function rollLoot(wh){
  const L=wh.loot;
  let count=L.count;
  if(Math.random()<0.1)count*=2;
  let src=[];
  if(L.pool==='GEAR')src=GEAR.filter(x=>x.cat===L.cat);
  else if(L.pool==='MARKET')src=(MARKET.products||[]).filter(p=>p.cat===L.cat);
  else if(L.pool==='ELITE')src=GEAR.filter(x=>x.rarity==='EPIC'||x.rarity==='LEGENDARY').concat((MARKET.products||[]).filter(p=>p.rarity==='LEGENDARY'));
  if(!src.length)return [];
  return sample(src,count,L.pool==='ELITE').map(p=>({
    name:p.name,rarity:p.rarity,cat:p.cat,desc:p.desc||'',
    hue:Math.floor(Math.random()*360),
    bought:Math.round(p.price||p.base||0),val:Math.round(p.price||p.base||0),
    gear:!!p.desc
  }));
}

let S={bal:100000,inv:[],tx:[],user:'ГОСТЬ',rep:0,promo:[]};
let TG_ID='';
let ui={page:'market',cat:'ALL',open:null,convoy:false,heist:false,barScroll:0};
let notes=[],unread=0,entered=false;
let MARKET={products:[],tick:0,raid:{active:false,left:0}};
let AUCTIONS=[],CONTRACTS=[];
let raidWas=false,stateReady=false,promoDraft='';
let pollStarted=false;
let HEIST=null;

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
    let ch=false;
    ['core','left','right','bottom'].forEach(k=>{
      if(CONVOY[k]&&!S.inv.some(x=>x.uid===CONVOY[k])){CONVOY[k]=null;ch=true}
    });
    const before=(CONVOY.top||[]).length;
    CONVOY.top=(CONVOY.top||[]).filter(uid=>S.inv.some(x=>x.uid===uid));
    if(CONVOY.top.length!==before)ch=true;
    if(ch)cvSave();
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

document.addEventListener('scroll',e=>{
  const t=e.target;
  if(t&&t.classList&&t.classList.contains('bar'))ui.barScroll=t.scrollLeft;
},true);

function setSig(sig){const v=$('#view');if(v)v.dataset.sig=ui.page+'|'+sig}
function getSig(){const v=$('#view');return v?v.dataset.sig||'':''}
function keyOf(x){return String(x.name).replace(/"/g,'')}

function render(){
  const y=window.scrollY||0;
  try{
    $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.page===ui.page));
    if(ui.heist)renderHeist();
    else if(ui.convoy)renderConvoy();
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

function marketList(){
  if(ui.cat==='WEAPON'||ui.cat==='ARMOR'||ui.cat==='AMMO'||ui.cat==='MERC')return GEAR.filter(x=>x.cat===ui.cat);
  let a=MARKET.products||[];
  if(ui.cat==='VEHICLES'){a=a.filter(p=>p.cat==='VEHICLES').concat(GEAR.filter(x=>x.cat==='VEHICLES'))}
  else if(ui.cat!=='ALL'){a=a.filter(p=>p.cat===ui.cat)}
  return a;
}
function listSig(list){return list.map(x=>keyOf(x)).join(',')}
function softMarket(){
  const list=marketList();
  const sig='m|'+ui.cat+'|'+listSig(list);
  if(getSig()!==sig){renderMarket();return}
  const st=$$('#view .stats .stat b');
  if(st.length>=4){
    st[0].textContent=(MARKET.products||[]).length;
    st[1].textContent=fmt(S.bal);
    st[2].textContent='#'+(MARKET.tick||0);
    st[3].textContent=S.inv.length;
  }
  const g=$('#grid');if(!g)return;
  list.forEach(x=>{
    if(x.desc)return;
    const el=g.querySelector('[data-key="'+keyOf(x)+'"]');if(!el)return;
    const c=((x.price/x.base)-1)*100;
    const rows=el.querySelectorAll('.row');
    if(rows[1])rows[1].querySelector('b').textContent=fmt(x.price);
    if(rows[2]){const b=rows[2].querySelector('b');b.textContent=pct(c);b.className=c>=0?'up':'dn'}
    const sv=el.querySelector('svg');
    if(sv){const tmp=document.createElement('div');tmp.innerHTML=spark(x.hist,c>=0);const ns=tmp.firstChild;if(ns)sv.replaceWith(ns)}
  });
}
function softAuctions(){
  const sig='a|'+AUCTIONS.map(a=>a.id).join(',');
  if(getSig()!==sig){renderAuctions();return}
  const h=$('#view .pt');if(h)h.textContent='АУКЦИОНЫ · '+AUCTIONS.length+' АКТИВНЫХ';
  AUCTIONS.forEach(a=>{
    const el=$('#view [data-auc="'+a.id+'"]');if(!el)return;
    const rows=el.querySelectorAll('.row');
    if(rows[1])rows[1].querySelector('b').textContent=fmt(a.bid);
    if(rows[2])rows[2].querySelector('b').textContent=a.leader||'—';
    if(rows[3])rows[3].querySelector('b').textContent=a.n;
    if(rows[4])rows[4].querySelector('b').textContent=left(a.left);
  });
}
function softInventory(){
  const sig='i|'+S.inv.map(i=>i.uid).join(',');
  if(getSig()!==sig){renderInventory();return}
  S.inv.forEach(i=>{
    const el=$('#view [data-uid="'+i.uid+'"]');if(!el)return;
    const rows=el.querySelectorAll('.row');
    const d=(i.val||i.bought)-(i.bought||0);
    if(rows[2])rows[2].querySelector('b').textContent=fmt(i.val||i.bought||0);
    if(rows[3]){const b=rows[3].querySelector('b');b.textContent=(d>=0?'+':'')+fmt(d);b.className=d>=0?'up':'dn'}
  });
}
function softContracts(){
  const sig='c|'+CONTRACTS.map(c=>c.id+c.st).join(',');
  if(getSig()!==sig){renderContracts();return}
  CONTRACTS.forEach(c=>{
    const el=$('#view [data-ctid="'+c.id+'"]');if(!el)return;
    const rows=el.querySelectorAll('.row');
    if(rows[2])rows[2].querySelector('b').textContent=left(c.left);
    if(c.st==='acc'&&rows[3]){
      const has=S.inv.some(x=>x.name===c.name);
      const b=rows[3].querySelector('b');b.textContent=has?'ДА':'НЕТ';b.className=has?'up':'dn';
      const btn=el.querySelector('[data-ct-done]');if(btn)btn.disabled=!has;
    }
  });
}
function softProfile(){
  const st=$$('#view .stats .stat b');
  if(st.length>=4){
    const worth=S.bal+S.inv.reduce((s,i)=>s+(i.val||i.bought||0),0);
    const profit=worth-100000;
    st[0].textContent=fmt(worth);
    st[1].textContent=(profit>=0?'+':'')+fmt(profit);st[1].className=profit>=0?'up':'dn';
    st[2].textContent=S.tx.length;
    st[3].textContent=S.inv.length;
  }
}
function softCraft(){
  const cards=$$('#view .card');
  Object.keys(RCP).forEach((k,idx)=>{
    const r=RCP[k];
    const have=S.inv.filter(x=>x.rarity===r.from&&!x.gear).length;
    const c=cards[idx];if(!c)return;
    const rows=c.querySelectorAll('.row');
    if(rows[1])rows[1].querySelector('b').textContent=have+' / '+r.need;
    const btn=c.querySelector('[data-craft]');if(btn)btn.disabled=have<r.need;
  });
}
function softRender(){
  hdr();
  if(ui.convoy||ui.open||ui.heist)return;
  if(ui.page==='market')softMarket();
  else if(ui.page==='auctions')softAuctions();
  else if(ui.page==='inventory')softInventory();
  else if(ui.page==='contracts')softContracts();
  else if(ui.page==='profile')softProfile();
  else if(ui.page==='craft')softCraft();
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

function startPoll(){
  if(pollStarted)return;pollStarted=true;
  setInterval(async()=>{
    if(!entered)return;
    const ae=document.activeElement;
    const busy=ui.open||(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'));
    if(!busy){await refreshAll();softRender()}
    else hdr();
  },5000);
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&entered){refreshAll().then(()=>softRender())}
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

async function buyGear(g,qty){
  if(g.cat==='MERC')qty=1;
  qty=Math.max(1,Math.min(99,Math.round(qty)||1));
  const total=g.price*qty;
  if(S.bal<total)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','Нужно '+fmt(total),'dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'buy',price:total,qty:qty,item:{name:g.name,rarity:g.rarity,cat:g.cat,hue:Math.floor(Math.random()*360),desc:g.desc,gear:true,rounds:g.rounds||0}});
  if(r.ok){
    showNotification('ПОКУПКА ЗАВЕРШЕНА',g.name+(qty>1?' ×'+qty:'')+' в инвентаре','up');
    SND.play(qty>1?'rare':'buy');
    closeModal();await loadState();render();
  }else{showNotification('ОШИБКА',r.msg||'Покупка не удалась','dn');SND.play('err')}
}
function confirmBuyGear(g){
  const batch=g.cat!=='MERC';
  ui.open='gear';
  modal('<h4>ЗАКУПКА · '+g.name+'</h4>'+
    '<div class="line"><span>ТИП</span><b>'+(RAR_RU[g.rarity]||g.rarity)+'</b></div>'+
    '<div class="line"><span>ХАРАКТЕРИСТИКИ</span><b style="text-align:right;font-size:10px">'+g.desc+'</b></div>'+
    '<div class="line"><span>ЦЕНА</span><b>'+fmt(g.price)+'</b></div>'+
    '<div class="line"><span>БАЛАНС</span><b>'+fmt(S.bal)+'</b></div>'+
    (batch
      ? '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">КОЛИЧЕСТВО (1–99)</span>'+
        '<input class="inp" id="qty" type="number" min="1" max="99" value="1">'+
        '<div class="line" style="margin-top:10px"><span>ИТОГО</span><b id="qty-total" style="color:var(--grn)">'+fmt(g.price)+'</b></div>'
      : '<div class="line" style="margin-top:10px"><span>КОЛИЧЕСТВО</span><b>1 шт · штучный товар</b></div>'+
        '<div class="line"><span>ИТОГО</span><b style="color:var(--grn)">'+fmt(g.price)+'</b></div>')+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  if(batch){
    const q=$('#qty');
    const upd=()=>{
      const n=Math.max(1,Math.min(99,+q.value||1));
      const t=$('#qty-total');if(t)t.textContent=fmt(g.price*n);
      const y=$('#m-yes');if(y)y.disabled=S.bal<g.price*n;
    };
    q.oninput=upd;upd();
    $('#m-no').onclick=closeModal;
    $('#m-yes').onclick=()=>buyGear(g,+q.value);
  }else{
    $('#m-no').onclick=closeModal;
    $('#m-yes').onclick=()=>buyGear(g,1);
  }
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
    '<div class="line"><span>ЗАКУПКА</span><b>'+(g.cat==='MERC'?'штучно, 1 в одни руки':'партиями 1–99 шт')+'</b></div>'+
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
  if(cvUids().has(i.uid))return showNotification('ПРЕДМЕТ В КОНВОЕ','Сначала выгрузи его из узла конвоя','dn'),SND.play('err');
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
function openProduct(name){
  const p=MARKET.products.find(x=>x.name===name);
  if(!p)return;
  ui.open=keyOf(p);
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
  const key=keyOf(p);
  return '<article class="card r-'+p.rarity+'" data-key="'+key+'">'+
    '<div class="art"><i></i></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)"><span>'+(RAR_RU[p.rarity]||p.rarity)+'</span><span>'+p.id+'</span></div>'+
    '<h3>'+p.name+'</h3>'+spark(p.hist,c>=0)+
    '<div class="row"><span>Продавец</span><b>'+p.seller+'</b></div>'+
    '<div class="row"><span>Цена</span><b style="color:var(--grn)">'+fmt(p.price)+'</b></div>'+
    '<div class="row"><span>Изменение</span><b class="'+(c>=0?'up':'dn')+'">'+pct(c)+'</b></div>'+
    '<div class="ft"><button class="btn pri" data-buy="'+key+'">КУПИТЬ</button><button class="btn" data-view="'+key+'">ДЕТАЛИ</button></div>'+
    '</article>';
}
function gearCard(g){
  const key=keyOf(g);
  return '<article class="card r-'+g.rarity+'" data-key="'+key+'">'+
    '<div class="art"><i></i></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)"><span>'+(RAR_RU[g.rarity]||g.rarity)+'</span><span>'+g.id+'</span></div>'+
    '<h3>'+g.name+'</h3>'+
    '<div style="font-size:10px;color:var(--mut);font-family:var(--mono);letter-spacing:.05em;margin:2px 0 8px;line-height:1.5">'+g.desc+'</div>'+
    '<div class="row"><span>Цена за шт</span><b style="color:var(--grn)">'+fmt(g.price)+'</b></div>'+
    '<div class="row"><span>Закупка</span><b>'+(g.cat==='MERC'?'штучно':'партиями 1–99')+'</b></div>'+
    '<div class="ft"><button class="btn pri" data-gbuy="'+g.id+'">КУПИТЬ</button><button class="btn" data-gview="'+g.id+'">ДЕТАЛИ</button></div>'+
    '</article>';
}
function renderGrid(){
  const g=$('#grid');if(!g)return;
  const list=marketList();
  g.innerHTML=list.length?list.map(x=>x.desc?gearCard(x):card(x)).join(''):'<div class="empty">НЕТ ЛОТОВ</div>';
  setSig('m|'+ui.cat+'|'+listSig(list));
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
    '<div class="stat"><small>ИНВЕНТАРЬ</small><b>'+S.inv.length+'</b></div></stats>'.replace('</stats>','</div>')+
    '<div class="bar">'+CATS.map(c=>'<button class="chip '+(c[0]===ui.cat?'on':'')+'" data-cat="'+c[0]+'">'+c[1]+'</button>').join('')+'</div>'+
    '<div id="grid" class="grid"></div>';
  renderGrid();
  const b=$('#view .bar');if(b&&ui.barScroll)b.scrollLeft=ui.barScroll;
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
  setSig('a|'+AUCTIONS.map(a=>a.id).join(','));
}
function renderContracts(){
  const open=CONTRACTS.filter(c=>c.st==='open');
  const mine=CONTRACTS.filter(c=>c.st==='acc');
  $('#view').innerHTML='<h2 class="pt">МОИ КОНТРАКТЫ · '+mine.length+'</h2>'+
    '<div class="grid">'+(mine.length?mine.map(c=>{
      const has=S.inv.some(x=>x.name===c.name);
      return '<article class="card r-'+c.rarity+'" data-ctid="'+c.id+'">'+
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
      return '<article class="card r-'+c.rarity+'" data-ctid="'+c.id+'">'+
        '<div class="art"><i></i></div>'+
        '<div style="font-size:10px;color:var(--amb);letter-spacing:.15em">ЗАКАЗЧИК: '+c.npc+'</div>'+
        '<h3>'+c.name+'</h3>'+
        '<div class="row"><span>Награда</span><b style="color:var(--grn)">'+fmt(c.reward)+'</b></div>'+
        '<div class="row"><span>Репутация</span><b>+'+c.rep+'</b></div>'+
        '<div class="row"><span>Истекает</span><b>'+left(c.left)+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-ct-accept="'+c.id+'">ПРИНЯТЬ</button></div>'+
        '</article>';
    }).join(''):'<div class="empty">ЗАКАЗОВ НЕТ</div>')+'</div>';
  setSig('c|'+CONTRACTS.map(c=>c.id+c.st).join(','));
}
function renderInventory(){
  const used=cvUids();
  $('#view').innerHTML='<h2 class="pt">МОЙ ИНВЕНТАРЬ · '+S.inv.length+'</h2><div class="grid">'+
    (S.inv.length?S.inv.map(i=>{
      const d=(i.val||i.bought)-(i.bought||0);
      return '<article class="card r-'+i.rarity+'" data-uid="'+i.uid+'"><div class="art"><i></i></div>'+
        '<h3>'+i.name+'</h3>'+
        (i.desc?'<div style="font-size:10px;color:var(--mut);font-family:var(--mono);letter-spacing:.05em;margin:-4px 0 8px;line-height:1.5">'+i.desc+'</div>':'')+
        '<div class="row"><span>Редкость</span><b>'+(RAR_RU[i.rarity]||i.rarity)+'</b></div>'+
        '<div class="row"><span>Куплено</span><b>'+fmt(i.bought||0)+'</b></div>'+
        '<div class="row"><span>Сейчас</span><b>'+fmt(i.val||i.bought||0)+'</b></div>'+
        '<div class="row"><span>П/У</span><b class="'+(d>=0?'up':'dn')+'">'+(d>=0?'+':'')+fmt(d)+'</b></div>'+
        (used.has(i.uid)?'<div class="row"><span>Статус</span><b style="color:var(--amb)">В КОНВОЕ</b></div>':'')+
        '<div class="ft"><button class="btn pri" data-sell="'+i.uid+'">ПРОДАТЬ</button></div></article>';
    }).join(''):'<div class="empty">ИНВЕНТАРЬ ПУСТ</div>')+'</div>';
  setSig('i|'+S.inv.map(i=>i.uid).join(','));
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

// ===== КОНВОЙ / АНГАР / ОГРАБЛЕНИЯ =====
function ensureCvCSS(){
  if($('#cv-css'))return;
  const s=document.createElement('style');
  s.id='cv-css';
  s.textContent=
    '.cv-head{display:flex;justify-content:space-between;align-items:center;margin:0 0 12px;font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--mut)}'+
    '.cv-head b{color:var(--grn);text-shadow:var(--glow-g)}'+
    '.cv-scheme{position:relative;display:grid;grid-template-columns:1fr 1.25fr 1fr;grid-auto-rows:minmax(104px,auto);gap:10px;max-width:560px;margin:0 auto}'+
    '.cv-top{grid-column:2;grid-row:1}.cv-left{grid-column:1;grid-row:2}.cv-core{grid-column:2;grid-row:2;min-height:138px}.cv-right{grid-column:3;grid-row:2}.cv-bottom{grid-column:2;grid-row:3}'+
    '.cv-slot{position:relative;border:1px solid var(--ln);border-radius:12px;background:rgba(16,18,24,.88);padding:10px;display:flex;flex-direction:column;gap:4px;overflow:hidden}'+
    '.cv-slot::after{content:"";position:absolute;left:0;right:0;top:-50%;height:45%;background:linear-gradient(180deg,transparent,rgba(126,224,143,.06),transparent);animation:artScan 4.5s linear infinite;pointer-events:none}'+
    '.cv-label{font-size:8px;letter-spacing:.2em;color:var(--mut)}'+
    '.cv-name{font-size:11px;letter-spacing:.1em;color:var(--tx);min-height:14px}'+
    '.cv-desc{font-size:9px;color:var(--mut);line-height:1.45;flex:1}'+
    '.cv-slot.filled{border-color:rgba(126,224,143,.5);box-shadow:inset 0 0 18px rgba(126,224,143,.08)}'+
    '.cv-core.filled{border-color:var(--amb);box-shadow:0 0 22px rgba(200,144,58,.25),inset 0 0 22px rgba(200,144,58,.10)}'+
    '.cv-acts{display:flex;gap:6px;margin-top:6px}.cv-acts .btn{flex:1;padding:8px 6px}'+
    '.hv-map{border:1px solid var(--ln);border-radius:10px;background:radial-gradient(80% 80% at 50% 50%,rgba(126,224,143,.05),rgba(5,6,7,.92));height:190px;position:relative;overflow:hidden}'+
    '.hv-map svg{width:100%;height:100%;display:block}'+
    '.hv-map::after{content:"";position:absolute;left:0;right:0;top:-50%;height:45%;background:linear-gradient(180deg,transparent,rgba(126,224,143,.08),transparent);animation:artScan 3s linear infinite;pointer-events:none}'+
    '.hv-bar{height:8px;border:1px solid var(--ln);border-radius:6px;margin:12px 0;overflow:hidden}'+
    '.hv-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--grn),var(--amb));box-shadow:0 0 12px rgba(126,224,143,.5)}'+
    '.wh-row{flex-direction:column;align-items:flex-start;gap:2px}'+
    '.wh-row.off{opacity:.45;cursor:not-allowed}'+
    '@media(max-width:430px){.cv-scheme{grid-template-columns:1fr 1fr}.cv-top{grid-column:1;grid-row:1}.cv-core{grid-column:2;grid-row:1;min-height:124px}.cv-left{grid-column:1;grid-row:2}.cv-right{grid-column:2;grid-row:2}.cv-bottom{grid-column:1/3;grid-row:3}}';
  document.head.appendChild(s);
}
function cvSlotHTML(slot){
  const m=CV_SLOTS[slot];
  if(slot==='top'){
    const crew=cvCrew();
    const names=crew.slice(0,3).map(c=>c.name.replace('ПОЗЫВНОЙ ','')).join(', ')+(crew.length>3?' +'+(crew.length-3):'');
    return '<div class="cv-slot cv-top'+(crew.length?' filled':'')+'">'+
      '<small class="cv-label">'+m.label+' // ЭКИПАЖ (МИН. '+CREW_MIN+')</small>'+
      '<b class="cv-name">'+(crew.length?crew.length+' / '+CREW_MIN+' бойцов':'— пусто —')+'</b>'+
      '<span class="cv-desc">'+(crew.length?names:'набери минимум '+CREW_MIN+' бойцов для выхода')+'</span>'+
      '<div class="cv-acts">'+(crew.length?'<button class="btn danger" data-cv-drop="top">ВЫГРУЗИТЬ</button>':'')+'<button class="btn pri" data-cv-pick="top">ДОБАВИТЬ</button></div>'+
      '</div>';
  }
  const it=cvItem(slot);
  return '<div class="cv-slot cv-'+slot+(it?' filled':'')+'">'+
    '<small class="cv-label">'+m.label+' // '+m.hint.toUpperCase()+'</small>'+
    '<b class="cv-name">'+(it?it.name:'— пусто —')+'</b>'+
    '<span class="cv-desc">'+(it?(it.desc||RAR_RU[it.rarity]||''):'нажми «ЗАГРУЗИТЬ» и выбери из инвентаря')+'</span>'+
    '<div class="cv-acts">'+(it?'<button class="btn danger" data-cv-drop="'+slot+'">ВЫГРУЗИТЬ</button>':'<button class="btn pri" data-cv-pick="'+slot+'">ЗАГРУЗИТЬ</button>')+'</div>'+
    '</div>';
}
function renderConvoy(){
  ensureCvCSS();
  const crew=cvCrew();
  const ready=(cvItem('core')?1:0)+(cvItem('left')?1:0)+(cvItem('right')?1:0)+(cvItem('bottom')?1:0)+(crew.length>=CREW_MIN?1:0);
  const worth=[cvItem('core'),cvItem('left'),cvItem('right'),cvItem('bottom')].reduce((s,it)=>s+(it?(it.val||it.bought||0):0),0)+
    crew.reduce((s,it)=>s+(it.val||it.bought||0),0);
  let def;
  if(ready===5)def='> конвой собран. ожидает приказа на выход.';
  else if(crew.length>0&&crew.length<CREW_MIN)def='> внимание: для выхода нужен экипаж не менее '+CREW_MIN+' бойцов (сейчас '+crew.length+').';
  else def='> загружено узлов: '+ready+'/5. модули ограбления неактивны.';
  $('#view').innerHTML=
    '<div class="convoy-top">'+
      '<button class="btn back-btn" data-convoy-back="1">← НАЗАД</button>'+
      '<b class="convoy-title">КОНВОЙ // АНГАР</b>'+
      '<span class="convoy-status">ГОТОВНОСТЬ '+ready+'/5</span>'+
    '</div>'+
    '<div class="hangar">'+
      '<div class="hangar-floor"></div>'+
      '<div class="cv-head"><span>СХЕМА КОНВОЯ // СОСТАВ</span><b>'+fmt(worth)+'</b></div>'+
      '<div class="cv-scheme">'+
        cvSlotHTML('top')+cvSlotHTML('left')+cvSlotHTML('core')+cvSlotHTML('right')+cvSlotHTML('bottom')+
      '</div>'+
      (convoyReady()?'<div class="ft" style="margin-top:14px"><button class="btn pri" data-heist="1">▶ ОТПРАВИТЬ КОНВОЙ</button></div>':'')+
      '<div class="hangar-log" id="hangar-log">'+(cvLog||def)+'</div>'+
    '</div>';
}
function convoyPick(slot){
  const m=CV_SLOTS[slot];
  const used=cvUids();
  const pool=S.inv.filter(x=>x.cat===m.accept&&!used.has(x.uid));
  if(!pool.length)return showNotification('НЕТ ГРУЗА','В инвентаре нет: '+m.hint+'. Купи на рынке.','dn'),SND.play('err');
  const multi=slot==='top';
  ui.open='cvpick';
  modal('<h4>'+(multi?'НАБОР ЭКИПАЖА // ':'ЗАГРУЗКА // ')+m.label+'</h4>'+
    '<div class="line"><span>ТИП УЗЛА</span><b>'+m.hint.toUpperCase()+(multi?' · МИН. '+CREW_MIN:'')+'</b></div>'+
    (multi?'<div class="line"><span>УЖЕ В ЭКИПАЖЕ</span><b>'+cvCrew().length+' / '+CREW_MIN+'</b></div>':'')+
    '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">'+(multi?'ОТМЕТЬ БОЙЦОВ (МОЖНО НЕСКОЛЬКИХ):':'ВЫБЕРИ ИЗ ИНВЕНТАРЯ:')+'</span>'+
    pool.map(x=>'<div class="sel-row" data-uid="'+x.uid+'"><b>'+x.name+'</b><span>'+(x.desc||fmt(x.val||x.bought))+'</span></div>').join('')+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes" disabled>'+(multi?'ДОБАВИТЬ':'ЗАГРУЗИТЬ')+'</button></div>');
  let sel=multi?[]:null;
  $$('.sel-row').forEach(el=>el.onclick=()=>{
    if(multi){
      el.classList.toggle('on');
      sel=$$('.sel-row.on').map(o=>+o.dataset.uid);
      $('#m-yes').disabled=!sel.length;
    }else{
      $$('.sel-row').forEach(o=>o.classList.remove('on'));
      el.classList.add('on');sel=+el.dataset.uid;
      $('#m-yes').disabled=false;
    }
    SND.play('click');
  });
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>{
    if(multi){
      if(!sel||!sel.length)return;
      CONVOY.top=(CONVOY.top||[]).concat(sel);cvSave();SND.play('ping');
      const n=cvCrew().length;
      cvLog='> экипаж пополнен: +'+sel.length+'. состав: '+n+'/'+CREW_MIN+'.';
      if(n>=CREW_MIN)showNotification('ЭКИПАЖ СОБРАН',CREW_MIN+'+ бойцов готовы к выходу','up');
      else showNotification('ЭКИПАЖ НЕ ПОЛОН','Нужно минимум '+CREW_MIN+', сейчас '+n,'dn');
    }else{
      if(sel==null)return;
      CONVOY[slot]=sel;cvSave();SND.play('ping');
      const it=S.inv.find(x=>x.uid===sel);
      cvLog='> узел «'+m.hint+'»: '+(it?it.name:'груз')+' закреплён за конвоем.';
      showNotification('УЗЕЛ АКТИВЕН',(it?it.name:'Предмет')+' → '+m.hint,'up');
    }
    closeModal();render();
  };
}
function convoyDrop(slot){
  if(slot==='top'){
    const n=cvCrew().length;
    CONVOY.top=[];cvSave();SND.play('close');
    cvLog='> экипаж распущен ('+n+' бойцов возвращены в инвентарь).';
    showNotification('ЭКИПАЖ РАСПУЩЕН',n+' бойцов возвращены в инвентарь');
    render();return;
  }
  const it=cvItem(slot);
  CONVOY[slot]=null;cvSave();SND.play('close');
  cvLog='> узел «'+CV_SLOTS[slot].hint+'» разгружен.'+(it?' груз возвращён в инвентарь.':'');
  showNotification('УЗЕЛ РАЗГРУЖЕН',it?it.name+' возвращён в инвентарь':'Слот освобождён');
  render();
}

// ===== ОГРАБЛЕНИЕ: ВЫБОР ЦЕЛИ, ОПЕРАЦИЯ, ИСХОД =====
function heistSelect(){
  if(!convoyReady())return showNotification('КОНВОЙ НЕ ГОТОВ','Загрузи все узлы и экипаж 5+','dn'),SND.play('err');
  ui.open='heistpick';
  modal('<h4>ВЫБОР ЦЕЛИ // ОГРАБЛЕНИЕ</h4>'+
    '<div class="line"><span>МОЩНОСТЬ КОНВОЯ</span><b>'+convoyScore()+' / '+MAX_SCORE+'</b></div>'+
    '<span style="font-size:11px;color:var(--mut);display:block;margin:10px 0 6px">ЧЕМ КРУПНЕЕ ОБЪЕКТ — ТЕМ НИЖЕ ШАНС И ВЫШЕ РИСК ПОТЕРИ</span>'+
    WAREHOUSES.map(w=>{
      const ch=heistChance(w);
      return '<div class="sel-row wh-row'+(w.locked?' off':'')+'" data-wh="'+w.id+'">'+
        '<b>'+w.name+(w.locked?' · СКОРО':'')+'</b>'+
        '<span>'+(w.locked?'модуль автоугона в разработке':'шанс успеха '+fmtChance(ch)+' · операция '+w.timer+' с')+'</span>'+
        '<div style="font-size:9px;color:var(--mut);margin-top:4px;line-height:1.5">'+w.desc+'</div>'+
        '</div>';
    }).join('')+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes" disabled>ОТПРАВИТЬ КОНВОЙ</button></div>');
  let selW=null;
  $$('.wh-row').forEach(el=>el.onclick=()=>{
    const w=WAREHOUSES.find(x=>x.id===el.dataset.wh);
    if(!w||w.locked)return SND.play('err');
    $$('.wh-row').forEach(o=>o.classList.remove('on'));
    el.classList.add('on');selW=w;
    $('#m-yes').disabled=false;SND.play('click');
  });
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>{if(!selW)return;closeModal();startHeist(selW)};
}
const HV_PTS=[[5,50],[25,42],[45,46],[65,30],[85,22],[95,12]];
function hvPoint(p){
  const segs=HV_PTS.length-1;
  const f=Math.max(0,Math.min(1,p))*segs;
  const i=Math.min(segs-1,Math.floor(f));
  const t=f-i;
  const a=HV_PTS[i],b=HV_PTS[i+1];
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
}
const HLOG=[
  [0,'> расчёт маршрута ухода...'],
  [8,'> маршрут построен: 3 точки смены транспорта'],
  [16,'> синхронизация GPS-меток экипажа...'],
  [26,'> экипаж в позиции ожидания'],
  [38,'> отключение периметральной сигнализации...'],
  [52,'> проникновение на объект...'],
  [66,'> работа внутри: поиск ценностей...'],
  [80,'> погрузка добычи...'],
  [92,'> выход по маршруту Б...']
];
function startHeist(wh){
  HEIST={wh:wh,start:Date.now(),dur:wh.timer*1000,chance:heistChance(wh),done:false,logIdx:0,iv:null};
  ui.heist=true;
  SND.play('raid');
  render();
  heistLoop();
}
function heistLoop(){
  if(HEIST&&HEIST.iv)clearInterval(HEIST.iv);
  HEIST.iv=setInterval(()=>{
    if(!HEIST)return;
    const el=Date.now()-HEIST.start;
    const p=Math.min(1,el/HEIST.dur);
    const t=$('#hv-timer');
    if(t)t.textContent=left(Math.max(0,Math.ceil((HEIST.dur-el)/1000)));
    const f=$('#hv-fill');if(f)f.style.width=(p*100).toFixed(1)+'%';
    const dot=$('#hv-dot');
    if(dot){const pt=hvPoint(p);dot.setAttribute('cx',pt[0].toFixed(1));dot.setAttribute('cy',pt[1].toFixed(1))}
    const lg=$('#hv-log');
    if(lg){
      while(HEIST.logIdx<HLOG.length&&HLOG[HEIST.logIdx][0]<=p*100){
        lg.innerHTML+=HLOG[HEIST.logIdx][1]+'<br>';
        HEIST.logIdx++;
        SND.play('click');
      }
    }
    if(p>=1){
      clearInterval(HEIST.iv);HEIST.iv=null;
      finishHeist();
    }
  },120);
}
function renderHeist(){
  ensureCvCSS();
  const h=HEIST;
  if(!h)return;
  $('#view').innerHTML=
    '<div class="convoy-top">'+
      '<b class="convoy-title">ОПЕРАЦИЯ // '+h.wh.name+'</b>'+
      '<span class="convoy-status">ШАНС '+fmtChance(h.chance)+'</span>'+
    '</div>'+
    '<div class="hangar">'+
      '<div class="hangar-floor"></div>'+
      '<div class="cv-head"><span>GPS // МАРШРУТ КОНВОЯ</span><b id="hv-timer">--:--</b></div>'+
      '<div class="hv-map"><svg viewBox="0 0 100 60" preserveAspectRatio="none">'+
        '<polyline points="5,50 25,42 45,46 65,30 85,22 95,12" fill="none" stroke="rgba(126,224,143,.35)" stroke-width="0.8" stroke-dasharray="2 2"/>'+
        '<circle cx="5" cy="50" r="1.6" fill="#7ee08f"/>'+
        '<circle cx="95" cy="12" r="2" fill="#c8903a"/>'+
        '<circle id="hv-dot" cx="5" cy="50" r="1.8" fill="#e8e8ea"/>'+
      '</svg></div>'+
      '<div class="hv-bar"><i id="hv-fill"></i></div>'+
      '<div class="hangar-log" id="hv-log" style="min-height:130px"></div>'+
    '</div>';
}
async function finishHeist(){
  if(!HEIST||HEIST.done)return;
  HEIST.done=true;
  const wh=HEIST.wh;
  const roll=Math.random()*100;
  const ok=roll<HEIST.chance;
  const crew=cvCrew();
  const loaded=[cvItem('core'),cvItem('left'),cvItem('right'),cvItem('bottom')].filter(Boolean).concat(crew);
  const ops={remove:[],update:[],add:[]};
  const report=[];
  let loot=null;
  if(ok){
    const am=cvItem('right');
    if(am&&am.rounds){
      const leftR=Math.max(0,Math.round(am.rounds*(0.1+Math.random()*0.5)));
      if(leftR<20){
        ops.remove.push(am.uid);
        report.push('боекомплект израсходован полностью');
      }else{
        ops.update.push({uid:am.uid,rounds:leftR,desc:am.desc.replace(/· остаток \d+ шт/,'')+' · остаток '+leftR+' шт',val:Math.max(1,Math.round((am.val||am.bought)*leftR/am.rounds))});
        report.push('израсходовано '+(am.rounds-leftR)+' патронов');
      }
    }
    loot=rollLoot(wh);
    loot.forEach(l=>ops.add.push(l));
    report.push('добыча: '+loot.length+' позиций погружено');
  }else{
    loaded.forEach(it=>ops.remove.push(it.uid));
    report.push('охрана сорвала операцию: конвой захвачен');
    report.push('конфисковано: '+loaded.length+' позиций снаряжения и экипаж');
  }
  await api('/api/action','POST',{action:'heist',ops:ops,label:wh.name,amount:0});
  if(!ok){CONVOY={core:null,left:null,right:null,bottom:null,top:[]};cvSave()}
  await loadState();
  ui.heist=false;HEIST=null;
  render();
  showHeistResult(ok,wh,report,loot);
}
function showHeistResult(ok,wh,report,loot){
  ui.open='heistres';
  modal('<h4>'+(ok?'ОПЕРАЦИЯ УСПЕШНА':'ОПЕРАЦИЯ ПРОВАЛЕНА')+' · '+wh.name+'</h4>'+
    '<div class="line"><span>ИТОГ</span><b class="'+(ok?'up':'dn')+'">'+(ok?'объект вскрыт, конвой ушёл':'конвой захвачен охраной')+'</b></div>'+
    report.map(r=>'<div class="line"><span>СВОДКА</span><b style="font-size:10px;text-align:right">'+r+'</b></div>').join('')+
    (ok&&loot&&loot.length?'<span style="font-size:11px;color:var(--mut);display:block;margin:12px 0 6px">ДОБЫЧА УЖЕ В ИНВЕНТАРЕ:</span>'+
      loot.map(l=>'<div class="drop-line r-'+l.rarity+'"><b>'+l.name+'</b><span>'+(RAR_RU[l.rarity]||'')+' · '+fmt(l.val)+'</span></div>').join(''):'')+
    (!ok?'<span style="font-size:11px;color:var(--red);display:block;margin-top:12px">Экипаж, стволы, броня, боекомплект и машина конфискованы. Конвой потерян.</span>':'')+
    '<div class="acts"><button class="btn pri" id="m-yes">ПРИНЯТО</button></div>');
  $('#m-yes').onclick=closeModal;
  SND.play(ok?'rare':'fail');
  showNotification(ok?'ОГРАБЛЕНИЕ УСПЕШНО':'КОНВОЙ ПОТЕРЯН',wh.name,ok?'up':'dn');
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
  if(ui.heist)return;
  const tab=e.target.closest('.tab');
  if(tab){ui.page=tab.dataset.page;ui.convoy=false;render();return}
  const cat=e.target.closest('[data-cat]');
  if(cat){
    ui.cat=cat.dataset.cat;
    $$('.chip').forEach(ch=>ch.classList.toggle('on',ch.dataset.cat===ui.cat));
    renderGrid();
    const b=$('#view .bar');if(b)b.scrollLeft=ui.barScroll;
    return;
  }
  const buy=e.target.closest('[data-buy]');
  if(buy){const p=MARKET.products.find(x=>x.name===buy.dataset.buy);if(p)confirmBuy(p);return}
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
  const cp=e.target.closest('[data-cv-pick]');
  if(cp){convoyPick(cp.dataset.cvPick);return}
  const cd3=e.target.closest('[data-cv-drop]');
  if(cd3){convoyDrop(cd3.dataset.cvDrop);return}
  const hs=e.target.closest('[data-heist]');
  if(hs){heistSelect();return}
  if(e.target.closest('#bell')){
    unread=0;badge();
    modal('<h4>УВЕДОМЛЕНИЯ</h4>'+(notes.slice(0,10).map(x=>'<div class="line"><span>'+x.title+'</span><b style="font-size:11px">'+x.msg+'</b></div>').join('')||'<div class="empty">ПУСТО</div>'));
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!ui.heist)closeModal()});

setInterval(()=>{
  const r=MARKET.raid||{active:false,left:0};
  const t=$('#rd-t'),bar=$('#rd-i');
  if(r.active){
    if(t)t.textContent='торги приостановлены · осталось '+Math.max(0,Math.floor(r.left))+' с';
    if(bar)bar.style.width=Math.max(0,Math.min(100,r.left/60*100))+'%';
  }
},1000);

setInterval(()=>{
  if(ui.page!=='auctions'||ui.open||ui.convoy||ui.heist)return;
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
  cvLoad();
  if(window.Telegram&&window.Telegram.WebApp){
    const tg=window.Telegram.WebApp;
    try{tg.ready();tg.expand()}catch(e){}
    const tu=tg.initDataUnsafe&&tg.initDataUnsafe.user;
    if(tu){const fn=((tu.first_name||'')+' '+(tu.last_name||'')).trim();if(fn)S.user=fn;else if(tu.username)S.user=tu.username}
    if(tg.initData){
      fetch('/api/tg/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:tg.initData})})
        .then(r=>r.json()).then(d=>{if(d&&d.valid){TG_ID=d.tg_id;cvLoad();loadState().catch(()=>{}).then(()=>{if(entered)render()})}}).catch(()=>{});
    }
  }
  boot();
})();
