'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>'₽ '+Math.round(n).toLocaleString('ru-RU');
const pct=c=>(c>=0?'+':'')+c.toFixed(2)+'%';
const left=s=>{s=Math.max(0,Math.floor(s));if(s>3600)return Math.floor(s/3600)+'ч '+Math.floor(s%3600/60)+'м';return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

let S={bal:100000,inv:[],tx:[],user:'GUEST'};
let TG_ID='';
let ui={page:'market',cat:'ALL',open:null};
let notes=[],unread=0,entered=false;
let MARKET={products:[],tick:0};
let AUCTIONS=[];

async function api(path,method,body){
  try{
    const o={method:method||'GET',headers:{}};
    if(TG_ID)o.headers['X-TG-ID']=TG_ID;
    if(body){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
    const r=await fetch(path,o);
    return await r.json();
  }catch(e){return{error:String(e)}}
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
  if(d&&!d.error){S.bal=d.balance!=null?d.balance:100000;const st=d.state||{};S.inv=st.inv||[];S.tx=st.tx||[];if(d.username)S.user=d.username}
}
async function loadMarket(){const d=await api('/api/market');if(d&&d.products)MARKET=d}
async function loadAuctions(){const d=await api('/api/auctions');if(d&&d.auctions)AUCTIONS=d.auctions}

async function buyProduct(p){
  const pr=Math.round(p.price);
  if(S.bal<pr)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','Баланс слишком мал','dn');
  const r=await api('/api/action','POST',{action:'buy',price:pr,item:{name:p.name,rarity:p.rarity,cat:p.cat,hue:Math.floor(Math.random()*360)}});
  if(r.ok){S.bal=r.balance;showNotification('ПОКУПКА ЗАВЕРШЕНА',p.name+' в инвентаре','up');closeModal();render()}
  else showNotification('ОШИБКА',r.msg||'Покупка не удалась','dn');
}
function sellProduct(uid,price){
  price=Math.round(price);
  if(!(price>0))return showNotification('НЕВЕРНАЯ ЦЕНА','Введите цену','dn');
  const it=S.inv.find(x=>x.uid==uid);
  api('/api/action','POST',{action:'sell',uid:uid,price:price}).then(r=>{
    if(r.ok){S.bal=r.balance;S.inv=S.inv.filter(x=>x.uid!=uid);
      S.tx.unshift({t:Date.now()/1000,type:'SELL',item:it?it.name:'',amount:price});
      showNotification('ПРОДАЖА ЗАВЕРШЕНА','Продано за '+fmt(price),'up');closeModal();render()}
    else showNotification('ОШИБКА',r.msg||'Продажа не удалась','dn');
  });
}
function sellModal(uid){
  const i=S.inv.find(x=>x.uid==uid);
  if(!i)return showNotification('ОШИБКА','Предмета нет','dn');
  modal('<h4>ПРОДАЖА ПРЕДМЕТА</h4><div class="line"><span>ПРЕДМЕТ</span><b>'+i.name+'</b></div>'+
    '<div class="line"><span>КУПЛЕНО ЗА</span><b>'+fmt(i.bought||0)+'</b></div>'+
    '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">ВАША ЦЕНА</span>'+
    '<input class="inp" id="ask" type="number" min="1" value="'+Math.round(i.val||i.bought||1000)+'">'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">ПРОДАТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>sellProduct(uid,+$('#ask').value);
}
function confirmBuy(p){
  const pr=Math.round(p.price);
  modal('<h4>ПОДТВЕРЖДЕНИЕ ПОКУПКИ</h4><div class="line"><span>ПРЕДМЕТ</span><b>'+p.name+'</b></div>'+
    '<div class="line"><span>ЦЕНА</span><b>'+fmt(pr)+'</b></div>'+
    '<div class="line"><span>БАЛАНС</span><b>'+fmt(S.bal)+'</b></div>'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>buyProduct(p);
}
function placeBid(auc,amount){
  amount=Math.round(amount);
  if(!(amount>0))return showNotification('ОШИБКА','Введите ставку','dn');
  api('/api/action','POST',{action:'bid',auction_id:auc.id,amount:amount}).then(r=>{
    if(r.ok){S.bal=r.balance;showNotification('СТАВКА ПРИНЯТА','Ставка '+fmt(amount),'up');closeModal();loadAuctions().then(render)}
    else showNotification('ОШИБКА',r.msg||'Ставка не принята','dn');
  });
}
function openAuction(a){
  ui.open=a.id;
  const minBid=a.bid+Math.max(100,Math.round(a.start*0.05));
  modal('<h4>АУКЦИОН · '+a.name+'</h4>'+
    '<div class="line"><span>РЕДКОСТЬ</span><b>'+a.rarity+'</b></div>'+
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
  modal('<h4>'+p.name+'</h4>'+
    '<div class="line"><span>ID</span><b>'+p.id+'</b></div>'+
    '<div class="line"><span>РЕДКОСТЬ</span><b>'+p.rarity+'</b></div>'+
    '<div class="line"><span>ЦЕНА</span><b style="color:var(--grn)">'+fmt(p.price)+'</b></div>'+
    '<div class="line"><span>ИЗМЕНЕНИЕ</span><b class="'+(c>=0?'up':'dn')+'">'+pct(c)+'</b></div>'+
    '<div class="line"><span>ПРОДАВЕЦ</span><b>'+p.seller+'</b></div>'+
    '<div class="acts"><button class="btn" id="m-no">ЗАКРЫТЬ</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=()=>confirmBuy(p);
}

function hdr(){const b=$('#bal');if(b)b.textContent=fmt(S.bal)}
function render(){
  $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.page===ui.page));
  if(ui.page==='market')renderMarket();
  else if(ui.page==='auctions')renderAuctions();
  else if(ui.page==='inventory')renderInventory();
  else renderProfile();
  hdr();
}
function card(p){
  const c=((p.price/p.base)-1)*100;
  return '<article class="card r-'+p.rarity+'">'+
    '<div class="art"><i></i></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)"><span>'+p.rarity+'</span><span>'+p.id+'</span></div>'+
    '<h3>'+p.name+'</h3>'+
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
    '<div class="bar">'+['ALL','TECH','ARTIFACTS','COLLECTIBLES','VEHICLES','DEVICES'].map(c=>'<button class="chip '+(c===ui.cat?'on':'')+'" data-cat="'+c+'">'+c+'</button>').join('')+'</div>'+
    '<div id="grid" class="grid"></div>';
  renderGrid();
}
function renderAuctions(){
  $('#view').innerHTML='<h2 class="pt">АУКЦИОНЫ · '+AUCTIONS.length+' АКТИВНЫХ</h2>'+
    '<div class="grid">'+(AUCTIONS.length?AUCTIONS.map(a=>{
      return '<article class="card r-'+a.rarity+'" data-auc="'+a.id+'">'+
        '<div class="art"><i></i></div><h3>'+a.name+'</h3>'+
        '<div class="row"><span>Ставка</span><b style="color:var(--grn)">'+fmt(a.bid)+'</b></div>'+
        '<div class="row"><span>Лидер</span><b>'+(a.leader||'—')+'</b></div>'+
        '<div class="row"><span>Ставок</span><b>'+a.n+'</b></div>'+
        '<div class="row"><span>Осталось</span><b class="dn">'+left(a.left)+'</b></div></article>';
    }).join(''):'<div class="empty">АУКЦИОНОВ НЕТ</div>')+'</div>';
}
function renderInventory(){
  $('#view').innerHTML='<h2 class="pt">МОЙ ИНВЕНТАРЬ · '+S.inv.length+'</h2><div class="grid">'+
    (S.inv.length?S.inv.map(i=>{
      return '<article class="card r-'+i.rarity+'"><div class="art"><i></i></div><h3>'+i.name+'</h3>'+
        '<div class="row"><span>Куплено</span><b>'+fmt(i.bought||0)+'</b></div>'+
        '<div class="row"><span>Сейчас</span><b>'+fmt(i.val||i.bought||0)+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-sell="'+i.uid+'">ПРОДАТЬ</button></div></article>';
    }).join(''):'<div class="empty">ИНВЕНТАРЬ ПУСТ</div>')+'</div>';
}
function renderProfile(){
  const worth=S.bal+S.inv.reduce((s,i)=>s+(i.val||i.bought||0),0);
  const profit=worth-100000;
  $('#view').innerHTML='<h2 class="pt">ПРОФИЛЬ</h2>'+
    '<div class="pf-h"><div class="av">👤</div><div class="pf-n"><b>'+S.user+'</b><small>ID: '+TG_ID+'</small></div></div>'+
    '<div class="stats"><div class="stat"><small>СОСТОЯНИЕ</small><b>'+fmt(worth)+'</b></div>'+
    '<div class="stat"><small>ПРИБЫЛЬ</small><b class="'+(profit>=0?'up':'dn')+'">'+(profit>=0?'+':'')+fmt(profit)+'</b></div>'+
    '<div class="stat"><small>СДЕЛОК</small><b>'+S.tx.length+'</b></div>'+
    '<div class="stat"><small>ИНВЕНТАРЬ</small><b>'+S.inv.length+'</b></div></div>'+
    '<h2 class="pt">ПОСЛЕДНИЕ СДЕЛКИ</h2><div style="display:flex;flex-direction:column;gap:8px">'+
    (S.tx.slice(0,15).map(t=>'<div class="line"><span>'+new Date(t.t*1000).toLocaleTimeString('ru-RU')+' · '+t.type+'</span><b class="'+(t.amount>0?'up':t.amount<0?'dn':'')+'">'+(t.amount?(t.amount>0?'+':'-')+fmt(Math.abs(t.amount)):'')+'</b></div>').join('')||'<div class="empty">НЕТ СДЕЛОК</div>')+'</div>';
}

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
  if(e.target.closest('#bell')){
    unread=0;badge();
    modal('<h4>УВЕДОМЛЕНИЯ</h4>'+(notes.slice(0,10).map(x=>'<div class="line"><span>'+x.title+'</span><b style="font-size:11px">'+x.msg+'</b></div>').join('')||'<div class="empty">ПУСТО</div>'));
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

function boot(){
  const lines=['CONNECTING...','ENCRYPTING SESSION...','ESTABLISHING SECURE CHANNEL...'];
  const L=$('#ld-line');let i=0;
  (function nx(){
    if(i<lines.length){L.textContent=lines[i++];setTimeout(nx,700)}
    else{L.textContent='CHANNEL READY';$('#enter').hidden=false}
  })();
  Promise.all([loadState().catch(()=>{}),loadMarket().catch(()=>{}),loadAuctions().catch(()=>{})]).then(()=>{if(entered)render()});
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
        .then(r=>r.json()).then(d=>{if(d&&d.valid){TG_ID=d.tg_id;S.user=d.username||'TRADER';loadState().catch(()=>{})}}).catch(()=>{});
    }
  }
  boot();
})();
