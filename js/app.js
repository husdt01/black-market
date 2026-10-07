'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>'₽ '+Math.round(n).toLocaleString('ru-RU');
const pct=c=>(c>=0?'+':'')+c.toFixed(2)+'%';
const left=s=>{s=Math.max(0,Math.floor(s));if(s>3600)return Math.floor(s/3600)+'ч '+Math.floor(s%3600/60)+'м';return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const RAR_RU={COMMON:'ОБЫЧНЫЙ',UNCOMMON:'НЕОБЫЧНЫЙ',RARE:'РЕДКИЙ',EPIC:'ЭПИЧЕСКИЙ',LEGENDARY:'ЛЕГЕНДАРНЫЙ',UNKNOWN:'НЕИЗВЕСТНО'};
const CATS=[['ALL','ВСЕ'],['TECH','ТЕХНИКА'],['ARTIFACTS','АРТЕФАКТЫ'],['COLLECTIBLES','КОЛЛЕКЦИЯ'],['VEHICLES','ТРАНСПОРТ'],['DEVICES','УСТРОЙСТВА'],['UNKNOWN','НЕИЗВЕСТНОЕ']];
const RCP={c3:{need:3,from:'COMMON',to:'UNCOMMON',chance:'85%',title:'3 × ОБЫЧНЫЙ → НЕОБЫЧНЫЙ'},e2:{need:2,from:'EPIC',to:'LEGENDARY',chance:'22%',title:'2 × ЭПИЧЕСКИЙ → ЛЕГЕНДАРНЫЙ'}};

let S={bal:100000,inv:[],tx:[],user:'ГОСТЬ',rep:0};
let TG_ID='';
let ui={page:'market',cat:'ALL',open:null};
let notes=[],unread=0,entered=false;
let MARKET={products:[],tick:0,raid:{active:false,left:0}};
let AUCTIONS=[],CONTRACTS=[];
let raidWas=false;

async function api(path,method,body){
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),10000);
  try{
    const o={method:method||'GET',headers:{},signal:ctl.signal};
    if(TG_ID)o.headers['X-TG-ID']=TG_ID;
    if(body){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
    const r=await fetch(path,o);return await r.json();
  }catch(e){return{error:String(e)}}
  finally{clearTimeout(to)}
}

function badge(){const b=$('#badge');if(b){b.hidden=!unread;b.textContent=unread}}
function showNotification(t,m,k){
  notes.unshift({title:t,msg:m,t:Date.now()});unread++;badge();
  const d=document.createElement('div');d.className='toast '+(k||'');
  d.innerHTML='<b>'+t+'</b><span>'+m+'</span>';
  $('#toasts').prepend(d);
  while($('#toasts').children.length>4)$('#toasts').lastChild.remove();
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
  if(d&&!d.error){S.bal=d.balance!=null?d.balance:100000;const st=d.state||{};S.inv=st.inv||[];S.tx=st.tx||[];S.rep=st.rep||0;if(d.username)S.user=d.username}
}
async function loadMarket(){const d=await api('/api/market');if(d&&d.products){MARKET=d;raidCheck()}}
async function loadAuctions(){const d=await api('/api/auctions');if(d&&d.auctions)AUCTIONS=d.auctions}
async function loadContracts(){const d=await api('/api/contracts');if(d&&d.contracts)CONTRACTS=d.contracts}

function raidCheck(){
  const r=MARKET.raid||{active:false,left:0};
  if(r.active&&!raidWas){SND.play('raid');showNotification('РЕЙД','Торги приостановлены, рынок заморожен','dn')}
  if(!r.active&&raidWas){SND.play('raidEnd');showNotification('РЕЙД ЗАВЕРШЁН','Цены обновлены после скачка','up')}
  raidWas=r.active;
  const el=$('#raid');if(el){el.classList.toggle('on',r.active)}
}

async function buyProduct(p){
  const pr=Math.round(p.price);
  if(S.bal<pr)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','Баланс слишком мал','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'buy',price:pr,item:{name:p.name,rarity:p.rarity,cat:p.cat,hue:Math.floor(Math.random()*360)}});
  if(r.ok){
    showNotification('ПОКУПКА ЗАВЕРШЕНА',p.name+' в инвентаре','up');
    SND.play(['EPIC','LEGENDARY'].includes(p.rarity)?'rare':'buy');
    closeModal();await loadState();render();
  }else{showNotification('ОШИБКА',r.msg||'Покупка не удалась','dn');SND.play('err')}
}
async function sellProduct(uid,price){
  price=Math.round(price);
  if(!(price>0))return showNotification('НЕВЕРНАЯ ЦЕНА','Введите цену','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'sell',uid:uid,price:price});
  if(r.ok){showNotification('ПРОДАЖА ЗАВЕРШЕНА','Продано за '+fmt(price),'up');SND.play('sell');closeModal();await loadState();render()}
  else{showNotification('ОШИБКА',r.msg||'Продажа не удалась','dn');SND.play('err')}
}
function sellModal(uid){
  const i=S.inv.find(x=>x.uid==uid);
  if(!i)return showNotification('ОШИБКА','Предмета нет','dn');
  const val=Math.round(i.val||i.bought||0);
  modal('<h4>ПРОДАЖА · '+i.name+'</h4>'+
    '<div class="line"><span>РЫНОЧНАЯ ЦЕНА</span><b>'+fmt(val)+'</b></div>'+
    '<div class="line"><span>КУПЛЕНО ЗА</span><b>'+fmt(i.bought||0)+'</b></div>'+
    '<div class="line"><span>МАКС. ЦЕНА (+15%)</span><b>'+fmt(Math.round(val*1.15))+'</b></div>'+
    '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">ВАША ЦЕНА</span>'+
    '<input class="inp" id="ask" type="number" min="1" value="'+val+'">'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">ПРОДАТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>sellProduct(uid,+$('#ask').value);
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

/* ===== КОНТРАКТЫ ===== */
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

/* ===== КРАФТ ===== */
function craftModal(rid){
  const r=RCP[rid];
  const pool=S.inv.filter(x=>x.rarity===r.from);
  if(pool.length<r.need)return showNotification('НЕ ХВАТАЕТ ПРЕДМЕТОВ','Нужно '+r.need+' шт. «'+(RAR_RU[r.from])+'», у вас '+pool.length,'dn'),SND.play('err');
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

/* ===== ГРАФИК ===== */
function spark(hist,up){
  if(!hist||hist.length<2)return'';
  const h=hist.slice(-40),mn=Math.min.apply(null,h),mx=Math.max.apply(null,h),rg=(mx-mn)||1;
  const pts=h.map((v,i)=>((i/(h.length-1))*100).toFixed(1)+','+(26-((v-mn)/rg)*24).toFixed(1)).join(' ');
  return '<svg viewBox="0 0 100 28" preserveAspectRatio="none" style="width:100%;height:34px;display:block;margin:8px 0;background:rgba(255,255,255,.02);border:1px solid var(--ln);border-radius:6px"><polyline points="'+pts+'" fill="none" stroke="'+(up?'#7ee08f':'#b8483f')+'" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
}

/* ===== РЕНДЕР СТРАНИЦ ===== */
function hdr(){const b=$('#bal');if(b)b.textContent=fmt(S.bal)}
function render(){
  $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.page===ui.page));
  if(ui.page==='market')renderMarket();
  else if(ui.page==='auctions')renderAuctions();
  else if(ui.page==='contracts')renderContracts();
  else if(ui.page==='inventory')renderInventory();
  else if(ui.page==='craft')renderCraft();
  else renderProfile();
  hdr();
}
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
function renderGrid(){
  const g=$('#grid');if(!g)return;
  let a=MARKET.products||[];
  if(ui.cat!=='ALL')a=a.filter(p=>p.cat===ui.cat);
  g.innerHTML=a.length?a.map(card).join(''):'<div class="empty">НЕТ ЛОТОВ</div>';
}
function renderMarket(){
  $('#view').innerHTML='<h2 class="pt">ОБЗОР РЫНКА</h2>'+
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
      const have=S.inv.filter(x=>x.rarity===r.from).length;
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
function renderProfile(){
  const worth=S.bal+S.inv.reduce((s,i)=>s+(i.val||i.bought||0),0);
  const profit=worth-100000;
  const sndOn=SND.on();
  $('#view').innerHTML='<h2 class="pt">ПРОФИЛЬ</h2>'+
    '<div class="pf-h"><div class="av">👤</div><div class="pf-n"><b>'+S.user+'</b><small>РЕПУТАЦИЯ: '+S.rep+' · ID: '+TG_ID.slice(0,14)+'</small></div></div>'+
    '<div class="stats"><div class="stat"><small>СОСТОЯНИЕ</small><b>'+fmt(worth)+'</b></div>'+
    '<div class="stat"><small>ПРИБЫЛЬ</small><b class="'+(profit>=0?'up':'dn')+'">'+(profit>=0?'+':'')+fmt(profit)+'</b></div>'+
    '<div class="stat"><small>СДЕЛОК</small><b>'+S.tx.length+'</b></div>'+
    '<div class="stat"><small>ИНВЕНТАРЬ</small><b>'+S.inv.length+'</b></div></div>'+
    '<div class="ft" style="margin-bottom:14px"><button class="btn '+(sndOn?'pri':'')+'" id="snd-btn">ЗВУК: '+(sndOn?'ВКЛ':'ВЫКЛ')+'</button></div>'+
    '<h2 class="pt">ПОСЛЕДНИЕ СДЕЛКИ</h2><div style="display:flex;flex-direction:column;gap:8px">'+
    (S.tx.slice(0,15).map(t=>'<div class="line"><span>'+new Date(t.t*1000).toLocaleTimeString('ru-RU')+' · '+t.type+'</span><b class="'+(t.amount>0?'up':t.amount<0?'dn':'')+'">'+(t.amount?(t.amount>0?'+':'-')+fmt(Math.abs(t.amount)):'—')+'</b></div>').join('')||'<div class="empty">НЕТ СДЕЛОК</div>')+'</div>';
  $('#snd-btn').onclick=()=>{SND.set(!SND.on());showNotification('ЗВУК',SND.on()?'Включён':'Выключен');render()};
}

/* ===== КЛИКИ ===== */
document.addEventListener('click',e=>{
  const tab=e.target.closest('.tab');
  if(tab){ui.page=tab.dataset.page;render();return}
  const cat=e.target.closest('[data-cat]');
  if(cat){ui.cat=cat.dataset.cat;renderMarket();return}
  const buy=e.target.closest('[data-buy]');
  if(buy){const p=MARKET.products.find(x=>x.id===buy.dataset.buy);if(p)confirmBuy(p);return}
  const view=e.target.closest('[data-view]');
  if(view){openProduct(view.dataset.view);return}
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
  if(e.target.closest('#bell')){
    unread=0;badge();
    modal('<h4>УВЕДОМЛЕНИЯ</h4>'+(notes.slice(0,10).map(x=>'<div class="line"><span>'+x.title+'</span><b style="font-size:11px">'+x.msg+'</b></div>').join('')||'<div class="empty">ПУСТО</div>'));
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

/* ===== РЕЙД-ТАЙМЕР ===== */
setInterval(()=>{
  const r=MARKET.raid||{active:false,left:0};
  const t=$('#rd-t'),bar=$('#rd-i');
  if(r.active){
    if(t)t.textContent='торги приостановлены · осталось '+r.left+' с';
    if(bar)bar.style.width=Math.max(0,Math.min(100,r.left/60*100))+'%';
  }
},1000);

/* ===== ЗАПУСК ===== */
function boot(){
  const lines=['СОЕДИНЕНИЕ...','ШИФРОВАНИЕ СЕССИИ...','УСТАНОВКА ЗАЩИЩЁННОГО КАНАЛА...'];
  const L=$('#ld-line');let i=0;
  (function nx(){
    if(i<lines.length){L.textContent=lines[i++];setTimeout(nx,700)}
    else{L.textContent='КАНАЛ ГОТОВ';$('#enter').hidden=false}
  })();
  Promise.all([loadState().catch(()=>{}),loadMarket().catch(()=>{}),loadAuctions().catch(()=>{}),loadContracts().catch(()=>{})]).then(()=>{if(entered)render()});
  $('#enter').addEventListener('click',()=>{
    entered=true;
    $('#loader').style.opacity='0';
    setTimeout(()=>{
      $('#loader').remove();
      $('#app').classList.remove('hidden');
      render();
      showNotification('ДОБРО ПОЖАЛОВАТЬ','Сессия открыта');
      setInterval(()=>{
        loadMarket().catch(()=>{});
        loadAuctions().catch(()=>{});
        loadContracts().catch(()=>{});
        if(!ui.open)render();else hdr();
      },5000);
    },800);
  });
}

(function(){
  TG_ID='guest_'+(localStorage.getItem('bm_guest')||Math.random().toString(36).slice(2));
  localStorage.setItem('bm_guest',TG_ID);
  if(window.Telegram&&window.Telegram.WebApp){
    const tg=window.Telegram.WebApp;
    try{tg.ready();tg.expand()}catch(e){}
    if(tg.initData){
      fetch('/api/tg/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:tg.initData})})
        .then(r=>r.json()).then(d=>{if(d&&d.valid){TG_ID=d.tg_id;S.user=d.username||'ТРЕЙДЕР';loadState().catch(()=>{}).then(()=>{if(entered)render()})}}).catch(()=>{});
    }
  }
  boot();
})();
