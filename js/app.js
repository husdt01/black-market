'use strict';

const SND = {
  _on: true,
  on: function() { return this._on; },
  set: function(v) { this._on = v; },
  play: function(type) {
    if (!this._on) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'rare') { osc.frequency.value = 800; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.15); }
      else if (type === 'err' || type === 'fail') { osc.frequency.value = 150; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.2); }
      else if (type === 'raid') { osc.frequency.value = 300; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.3); }
      else if (type === 'raidEnd') { osc.frequency.value = 600; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.2); }
      else if (type === 'sell') { osc.frequency.value = 500; gain.gain.value = 0.08; osc.start(); osc.stop(ctx.currentTime + 0.1); }
      else if (type === 'buy' || type === 'click' || type === 'ping') { osc.frequency.value = 400; gain.gain.value = 0.05; osc.start(); osc.stop(ctx.currentTime + 0.05); }
      else if (type === 'craft') { osc.frequency.value = 250; gain.gain.value = 0.08; osc.start(); osc.stop(ctx.currentTime + 0.12); }
    } catch(e) {}
  }
};

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>'₽ '+Math.round(n).toLocaleString('ru-RU');
const pct=c=>(c>=0?'+':'')+c.toFixed(2)+'%';
const left=s=>{s=Math.max(0,Math.floor(s));if(s>3600)return Math.floor(s/3600)+'ч '+Math.floor(s%3600/60)+'м';return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const RAR_RU={COMMON:'ОБЫЧНЫЙ',UNCOMMON:'НЕОБЫЧНЫЙ',RARE:'РЕДКИЙ',EPIC:'ЭПИЧЕСКИЙ',LEGENDARY:'ЛЕГЕНДАРНЫЙ',UNKNOWN:'НЕИЗВЕСТНО',RUNE:'РУНА'};
const CATS=[['ALL','ВСЕ'],['TECH','ТЕХНИКА'],['ARTIFACTS','АРТЕФАКТЫ'],['COLLECTIBLES','КОЛЛЕКЦИЯ'],['VEHICLES','ТРАНСПОРТ'],['DEVICES','УСТРОЙСТВА'],['UNKNOWN','НЕИЗВЕСТНОЕ']];
const INV_FILTERS=[['ALL','ВСЕ'],['ITEM','ПРЕДМЕТЫ'],['VEHICLE','МАШИНЫ'],['WEAPON','ОРУЖИЕ'],['ARMOR','БРОНЯ'],['MERC','НАЁМНИКИ'],['RUNE','РУНЫ'],['CASE','КЕЙСЫ']];
const RCP={c3:{need:3,from:'COMMON',to:'UNCOMMON',chance:'85%',title:'3 × ОБЫЧНЫЙ → НЕОБЫЧНЫЙ'},e2:{need:2,from:'EPIC',to:'LEGENDARY',chance:'22%',title:'2 × ЭПИЧЕСКИЙ → ЛЕГЕНДАРНЫЙ'}};
const CASES={c50:{price:50000,name:'СТАЛЬНОЙ',t:1},c100:{price:100000,name:'ТЕНЕВОЙ',t:2},c150:{price:150000,name:'ОМЕГА',t:3},c500:{price:500000,name:'РУНА',t:4},c1m:{price:1000000,name:'АРСЕНАЛ',t:5},c5m:{price:5000000,name:'КОНВОЙ',t:6}};
const STAR_PKGS={p10:{stars:10,bal:50000},p25:{stars:25,bal:140000},p50:{stars:50,bal:300000},p100:{stars:100,bal:650000}};
const VEHICLES=[['ПЫЛЬНЫЙ БЕГУН',1000000,1,'COMMON'],['СТАЛЬНОЙ ВОЛК',2500000,2,'UNCOMMON'],['ЧЁРНЫЙ ЯСТРЕБ',5000000,3,'RARE'],['ПРИЗРАК ШОССЕ',8000000,4,'RARE'],['ЖЕЛЕЗНЫЙ ВОРОБЕЙ',12000000,5,'EPIC'],['ОНИКСОВОЕ КРЫЛО',15000000,6,'EPIC'],['ТЕНЕВОЙ СТРАЖ',18000000,7,'LEGENDARY'],['ШТОРМОВОЙ КАТЕР',20000000,8,'LEGENDARY'],['БРОНЕНОСЕЦ ZERO',23000000,9,'LEGENDARY'],['ЛЕВИАФАН',25000000,10,'LEGENDARY']];
const WEAPONS=[['ПЕПЕЛЬНЫЙ НОЖ',50000,1,'COMMON'],['КВАНТОВЫЙ ПИСТОЛЕТ',150000,2,'UNCOMMON'],['НУАР-ВИНТОВКА',400000,3,'RARE'],['КРИО-ШТУРМ',900000,4,'EPIC'],['ОБСИДИАНОВЫЙ ЛУЧ',2000000,5,'LEGENDARY']];
const ARMOR=[['КЕВЛАР-1',30000,1,'COMMON'],['СТАЛЬНАЯ ПЛАСТИНА',120000,2,'UNCOMMON'],['ТИТАН-3',350000,3,'RARE'],['НУЛЕВАЯ БРОНЯ',800000,4,'EPIC']];
const MERCENARIES=[['БЕГУН',80000,1,'COMMON'],['СТРЕЛОК',250000,2,'UNCOMMON'],['ТЕНЬ',600000,3,'RARE'],['ПРИЗРАК',1500000,4,'EPIC']];

let S={bal:100000,inv:[],tx:[],user:'ГОСТЬ',rep:0,promo:[],convoy:{vehicle:null,mercenaries:[],weapons:[],armor:[]}};
let TG_ID='';
let ui={page:'market',cat:'ALL',invFilter:'ALL',open:null};
let notes=[],unread=0,entered=false;
let MARKET={products:[],tick:0,raid:{active:false,left:0}};
let AUCTIONS=[],CONTRACTS=[],RUNE_CONTRACTS=[];
let raidWas=false,stateReady=false,promoDraft='';

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
  if(d&&!d.error){
    const old=new Set(S.inv.map(x=>x.uid));
    S.bal=d.balance!=null?d.balance:100000;
    const st=d.state||{};S.inv=st.inv||[];S.tx=st.tx||[];S.rep=st.rep||0;S.promo=st.promo||[];S.convoy=st.convoy||{vehicle:null,mercenaries:[],weapons:[],armor:[]};
    if(d.username&&S.user==='ГОСТЬ')S.user=d.username;
    if(stateReady){S.inv.forEach(x=>{if(!old.has(x.uid)){showNotification('ПОСТАВКА',x.name+' поступил в инвентарь','up');SND.play('ping')}})}
    stateReady=true;
  }
}
async function loadMarket(){const d=await api('/api/market');if(d&&d.products){MARKET=d;raidCheck()}}
async function loadAuctions(){const d=await api('/api/auctions');if(d&&d.auctions)AUCTIONS=d.auctions}
async function loadContracts(){const d=await api('/api/contracts');if(d&&d.contracts)CONTRACTS=d.contracts}
async function loadRuneContracts(){const d=await api('/api/rune-contracts');if(d&&d.contracts)RUNE_CONTRACTS=d.contracts}

function raidCheck(){
  const r=MARKET.raid||{active:false,left:0};
  if(r.active&&!raidWas){SND.play('raid');showNotification('РЕЙД','Торги приостановлены, рынок заморожен','dn')}
  if(!r.active&&raidWas){SND.play('raidEnd');showNotification('РЕЙД ЗАВЕРШЁН','Цены обновлены после скачка','up')}
  raidWas=r.active;
  const el=$('#raid');if(el){el.classList.toggle('on',r.active)}
}

async function buyProduct(p,qty){
  qty=qty||1;
  const pr=Math.round(p.price)*qty;
  if(S.bal<pr)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','Баланс слишком мал','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'buy',price:Math.round(p.price),qty:qty,item:{name:p.name,rarity:p.rarity,cat:p.cat,hue:Math.floor(Math.random()*360)}});
  if(r.ok){
    showNotification('ПОКУПКА ЗАВЕРШЕНА',p.name+' x'+qty+' в инвентаре','up');
    SND.play(['EPIC','LEGENDARY','RUNE'].includes(p.rarity)?'rare':'buy');
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
async function sellModal(uid){
  const i=S.inv.find(x=>x.uid==uid);
  if(!i)return showNotification('ОШИБКА','Предмета нет','dn');
  ui.open='sell';
  if(i.rune||i.case){
    const val=i.val||i.bought||0;
    const label=i.case?'КЕЙС · ФИКС-ЦЕНА':'РУНА · ФИКС-ЦЕНА';
    modal('<h4>ПРОДАЖА · '+i.name+'</h4>'+
      '<div class="line"><span>ТИП</span><b style="color:var(--amb)">'+label+'</b></div>'+
      '<div class="line"><span>ФИКС-ЦЕНА</span><b>'+fmt(val)+'</b></div>'+
      '<span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">Продаётся только по фиксированной стоимости.</span>'+
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
  const isArmor=ARMOR.some(a=>a[0]===p.name);
  modal('<h4>ПОДТВЕРЖДЕНИЕ ПОКУПКИ</h4><div class="line"><span>ПРЕДМЕТ</span><b>'+p.name+'</b></div>'+
    '<div class="line"><span>РЕДКОСТЬ</span><b>'+(RAR_RU[p.rarity]||p.rarity)+'</b></div>'+
    '<div class="line"><span>ЦЕНА ЗА ШТ.</span><b>'+fmt(pr)+'</b></div>'+
    (isArmor?'<span style="font-size:11px;color:var(--mut);display:block;margin-top:8px">КОЛИЧЕСТВО</span><input class="inp" id="buy-qty" type="number" min="1" max="50" value="1">':'')+
    '<div class="line" style="margin-top:8px"><span>ИТОГО</span><b id="buy-total">'+fmt(pr)+'</b></div>'+
    '<div class="line"><span>БАЛАНС</span><b>'+fmt(S.bal)+'</b></div>'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">КУПИТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  if(isArmor){
    $('#buy-qty').oninput=()=>{const q=Math.max(1,parseInt($('#buy-qty').value)||1);$('#buy-total').textContent=fmt(pr*q)};
  }
  $('#m-yes').onclick=()=>{
    const qty=isArmor?Math.max(1,parseInt($('#buy-qty').value)||1):1;
    buyProduct(p,qty);
  };
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

async function rcAccept(id){
  const r=await api('/api/action','POST',{action:'rc-accept',id:id});
  if(r.ok){showNotification('ЗАДАНИЕ ПРИНЯТО','Добудьте нужные руны','up');SND.play('ping');await loadRuneContracts();render()}
  else showNotification('ОШИБКА',r.msg||'','dn');
}
async function rcDone(id){
  const r=await api('/api/action','POST',{action:'rc-done',id:id});
  if(r.ok){showNotification('ЗАДАНИЕ ВЫПОЛНЕНО','+'+fmt(r.reward),'up');SND.play('rare');await loadState();await loadRuneContracts();render()}
  else{showNotification('НЕ ВЫШЛО',r.msg||'','dn');SND.play('err')}
}
async function rcDrop(id){
  await api('/api/action','POST',{action:'rc-drop',id:id});
  showNotification('ЗАДАНИЕ СБРОШЕНО');
  await loadRuneContracts();render();
}

async function buyMerc(name,price){
  if(S.bal<price)return showNotification('НЕДОСТАТОЧНО СРЕДСТВ','','dn'),SND.play('err');
  const r=await api('/api/action','POST',{action:'buy',price:price,qty:1,item:{name:name,rarity:MERCENARIES.find(m=>m[0]===name)[3],cat:'MERC',hue:Math.floor(Math.random()*360),power:MERCENARIES.find(m=>m[0]===name)[2]}});
  if(r.ok){showNotification('НАЁМНИК НАНЯТ',name,'up');SND.play('buy');await loadState();render()}
  else{showNotification('ОШИБКА',r.msg||'','dn');SND.play('err')}
}

function craftModal(rid){
  const r=RCP[rid];
  const pool=S.inv.filter(x=>x.rarity===r.from);
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

function caseModal(cid){
  const c=CASES[cid];
  ui.open='case';
  modal('<h4>КОНТЕЙНЕР · '+c.name+'</h4>'+
    '<div class="line"><span>ЦЕНА</span><b>'+fmt(c.price)+'</b></div>'+
    '<div class="line"><span>БАЛАНС</span><b>'+fmt(S.bal)+'</b></div>'+
    (cid==='c500'?'<div class="line"><span>ВНУТРИ</span><b style="color:#a06be0">СЕКРЕТНЫЕ РУНЫ</b></div>':
     cid==='c1m'?'<div class="line"><span>ВНУТРИ</span><b style="color:var(--amb)">2+ ОРУЖИЯ</b></div>':
     cid==='c5m'?'<div class="line"><span>ВНУТРИ</span><b style="color:var(--grn)">БРОНЕТЕХНИКА</b></div>':
     '<div class="line"><span>МУЛЬТИ-ДРОП</span><b>до 3 предметов</b></div>')+
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
      $('#cdrops').innerHTML=r.drops.map((d,i)=>'<div class="drop-line r-'+d.rarity+'" style="animation-delay:'+(i*0.15)+'s"><b>'+d.name+'</b><span>'+(RAR_RU[d.rarity]||d.rarity)+(d.power?' · сила '+d.power:'')+'</span></div>').join('');
      const best=Math.max.apply(null,r.drops.map(d=>d.mult||1));
      if(best>=1.8||r.drops.length>1)SND.play('rare');else SND.play('buy');
      showNotification('КОНТЕЙНЕР ОТКРЫТ','Предметов: '+r.drops.length,'up');
      await loadState();hdr();
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
      SND.play('rare');
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
    if(r.item){showNotification('ДОСТУП РАЗРЕШЁН','Получен артефакт: '+r.item,'up');}
    else{showNotification('ДОСТУП РАЗРЕШЁН','Ключ принят: +'+fmt(r.reward),'up');}
    promoDraft='';await loadState();render();
  }else{SND.play('err');showNotification('ДОСТУП ЗАПРЕЩЁН',r.msg||'','dn');}
}

function convoyPower(){
  let p=0;
  const v=S.convoy.vehicle?S.inv.find(x=>x.uid==S.convoy.vehicle):null;
  if(v)p+=v.power||1;
  S.convoy.mercenaries.forEach(uid=>{const m=S.inv.find(x=>x.uid==uid);if(m)p+=m.power||1});
  S.convoy.weapons.forEach(uid=>{const w=S.inv.find(x=>x.uid==uid);if(w)p+=w.power||1});
  S.convoy.armor.forEach(uid=>{const a=S.inv.find(x=>x.uid==uid);if(a)p+=a.power||1});
  return p;
}
function convoyChance(){return Math.min(95,25+convoyPower()*3)}
function convoyReward(){return 5000000+convoyPower()*500000}

function pickForConvoy(type){
  const pool=S.inv.filter(x=>{
    if(type==='vehicle')return x.vehicle||x.cat==='VEHICLE';
    if(type==='mercenary')return x.cat==='MERC';
    if(type==='weapon')return x.weapon||x.cat==='WEAPON';
    if(type==='armor')return x.cat==='ARMOR';
    return false;
  });
  if(!pool.length)return showNotification('НЕТ ПРЕДМЕТОВ','Сначала купите или выбейте','dn'),SND.play('err');
  ui.open='convoy-pick';
  modal('<h4>ВЫБОР · '+type.toUpperCase()+'</h4>'+
    pool.map(x=>'<div class="sel-row" data-uid="'+x.uid+'"><b>'+x.name+'</b><span>'+(RAR_RU[x.rarity]||x.rarity)+(x.power?' · сила '+x.power:'')+'</span></div>').join('')+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button></div>');
  $$('.sel-row').forEach(el=>el.onclick=()=>{
    const uid=+el.dataset.uid;
    if(type==='vehicle'){S.convoy.vehicle=S.convoy.vehicle===uid?null:uid;}
    else if(type==='mercenary'){
      if(S.convoy.mercenaries.includes(uid))S.convoy.mercenaries=S.convoy.mercenaries.filter(x=>x!==uid);
      else if(S.convoy.mercenaries.length<4)S.convoy.mercenaries.push(uid);
      else return showNotification('МАКС. 4 НАЁМНИКА','','dn');
    }else if(type==='weapon'){
      if(S.convoy.weapons.includes(uid))S.convoy.weapons=S.convoy.weapons.filter(x=>x!==uid);
      else if(S.convoy.weapons.length<3)S.convoy.weapons.push(uid);
      else return showNotification('МАКС. 3 ОРУЖИЯ','','dn');
    }else if(type==='armor'){
      if(S.convoy.armor.includes(uid))S.convoy.armor=S.convoy.armor.filter(x=>x!==uid);
      else if(S.convoy.armor.length<3)S.convoy.armor.push(uid);
      else return showNotification('МАКС. 3 БРОНИ','','dn');
    }
    SND.play('click');
    closeModal();
    render();
    setTimeout(()=>pickForConvoy(type),50);
  });
  $('#m-no').onclick=closeModal;
}

async function startConvoy(){
  if(!S.convoy.vehicle)return showNotification('НУЖНА МАШИНА','Добавьте машину в конвой','dn'),SND.play('err');
  const chance=convoyChance();
  modal('<h4>НАЧАТЬ РЕЙД?</h4>'+
    '<div class="line"><span>СИЛА КОНВОЯ</span><b>'+convoyPower()+'</b></div>'+
    '<div class="line"><span>ШАНС УСПЕХА</span><b class="up">'+chance+'%</b></div>'+
    '<div class="line"><span>ОЖИДАЕМАЯ НАГРАДА</span><b style="color:var(--grn)">'+fmt(convoyReward())+' + КЕЙС</b></div>'+
    '<span style="font-size:11px;color:var(--red);display:block;margin-top:12px">⚠ ВСЕ КОМПОНЕНТЫ БУДУТ ПОТРАЧЕНЫ НЕЗАВИСИМО ОТ ИСХОДА</span>'+
    '<div class="acts"><button class="btn" id="m-no">ОТМЕНА</button><button class="btn pri" id="m-yes">В ПУТЬ</button></div>');
  $('#m-no').onclick=closeModal;
  $('#m-yes').onclick=async()=>{
    closeModal();
    ui.open='convoy-run';
    modal('<h4>РЕЙД ИДЁТ...</h4><div class="case-box opening" id="cbox"><i></i><b></b></div><div style="text-align:center;color:var(--mut);font-size:11px;letter-spacing:.2em" id="cstat">КОНВОЙ В ПУТИ...</div><div id="cdrops"></div>');
    SND.play('raid');
    const r=await api('/api/action','POST',{action:'start_convoy'});
    setTimeout(()=>{
      const box=$('#cbox');if(box)box.style.display='none';
      const st=$('#cstat');
      if(r.ok){
        if(r.success){
          if(st)st.innerHTML='<b style="color:var(--grn);font-size:14px">РЕЙД УСПЕШЕН</b>';
          $('#cdrops').innerHTML='<div class="drop-line r-LEGENDARY"><b>КЕЙС КОНВОЯ</b><span>фикс-цена '+fmt(15000000)+'</span></div>'+
            '<div class="drop-line r-EPIC"><b>НАГРАДА</b><span>'+fmt(r.reward)+'</span></div>';
          SND.play('rare');
          showNotification('РЕЙД УСПЕШЕН','+'+fmt(r.reward)+' + КЕЙС','up');
        }else{
          if(st)st.innerHTML='<b style="color:var(--red);font-size:14px">РЕЙД ПРОВАЛЕН</b>';
          $('#cdrops').innerHTML='<div class="drop-line"><b>КОНВОЙ ПОТЕРЯН</b><span>компоненты сгорели</span></div>';
          SND.play('fail');
          showNotification('РЕЙД ПРОВАЛЕН','Компоненты потеряны','dn');
        }
        ui.open=null;
        await loadState();render();
      }else{
        if(st)st.textContent='ОШИБКА';
        $('#cdrops').innerHTML='<div class="empty">'+(r.msg||'')+'</div>';
        SND.play('err');
      }
    },1500);
  };
}

function spark(hist,up){
  if(!hist||hist.length<2)return'';
  const h=hist.slice(-40),mn=Math.min.apply(null,h),mx=Math.max.apply(null,h),rg=(mx-mn)||1;
  const pts=h.map((v,i)=>((i/(h.length-1))*100).toFixed(1)+','+(26-((v-mn)/rg)*24).toFixed(1)).join(' ');
  return '<svg viewBox="0 0 100 28" preserveAspectRatio="none" style="width:100%;height:34px;display:block;margin:8px 0;background:rgba(255,255,255,.02);border:1px solid var(--ln);border-radius:6px"><polyline points="'+pts+'" fill="none" stroke="'+(up?'#7ee08f':'#b8483f')+'" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
}

function hdr(){const b=$('#bal');if(b)b.textContent=fmt(S.bal)}
function render(){
  $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.page===ui.page));
  if(ui.page==='market')renderMarket();
  else if(ui.page==='auctions')renderAuctions();
  else if(ui.page==='missions')renderMissions();
  else if(ui.page==='inventory')renderInventory();
  else if(ui.page==='mercenaries')renderMercenaries();
  else if(ui.page==='profile')renderProfile();
  hdr();
}
function card(p){
  const c=((p.price/p.base)-1)*100;
  const isArmor=ARMOR.some(a=>a[0]===p.name);
  return '<article class="card r-'+p.rarity+'">'+
    '<div class="art"><i></i></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)"><span>'+(RAR_RU[p.rarity]||p.rarity)+'</span><span>'+p.id+'</span></div>'+
    '<h3>'+p.name+'</h3>'+spark(p.hist,c>=0)+
    '<div class="row"><span>Продавец</span><b>'+p.seller+'</b></div>'+
    '<div class="row"><span>Цена</span><b style="color:var(--grn)">'+fmt(p.price)+(isArmor?' <small style="color:var(--mut)">/ шт.</small>':'')+'</b></div>'+
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
  $('#view').innerHTML='<h2 class="pt">КОНТЕЙНЕРЫ</h2>'+
    '<div class="case-row">'+Object.keys(CASES).map(k=>{const c=CASES[k];
      return '<div class="case-card t'+c.t+'" data-case="'+k+'"><div class="case-ico"><i></i><b></b></div><h5>'+c.name+'</h5><small>'+(k==='c1m'?'2+ оружия':k==='c5m'?'бронетехника':'мульти-дроп')+'</small><b class="cp">'+fmt(c.price)+'</b></div>';
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
function renderMissions(){
  const open=RUNE_CONTRACTS.filter(c=>c.st==='open');
  const mine=RUNE_CONTRACTS.filter(c=>c.st==='acc');
  $('#view').innerHTML='<h2 class="pt">АКТИВНЫЕ ЗАДАНИЯ · '+mine.length+'</h2>'+
    '<div class="grid">'+(mine.length?mine.map(c=>{
      const have=S.inv.filter(x=>x.name===c.rune_name&&x.rune).length;
      return '<article class="card r-LEGENDARY">'+
        '<div style="font-size:10px;color:var(--amb);letter-spacing:.15em">СЕКРЕТНЫЙ КОНТРАКТ</div>'+
        '<h3>'+c.rune_name+' × '+c.count+'</h3>'+
        '<div class="row"><span>Награда</span><b style="color:var(--grn)">'+fmt(c.reward+c.bonus)+'</b></div>'+
        '<div class="row"><span>Бонус</span><b class="up">+'+fmt(c.bonus)+'</b></div>'+
        '<div class="row"><span>Осталось</span><b class="dn">'+left(c.left)+'</b></div>'+
        '<div class="row"><span>Рун у вас</span><b class="'+(have>=c.count?'up':'dn')+'">'+have+' / '+c.count+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-rc-done="'+c.id+'" '+(have>=c.count?'':'disabled')+'>СДАТЬ</button><button class="btn danger" data-rc-drop="'+c.id+'">СБРОС</button></div>'+
        '</article>';
    }).join(''):'<div class="empty">НЕТ АКТИВНЫХ ЗАДАНИЙ</div>')+'</div>'+
    '<h2 class="pt">ДОСТУПНЫЕ ЗАКАЗЫ · '+open.length+'</h2>'+
    '<div class="grid">'+(open.length?open.map(c=>{
      return '<article class="card r-LEGENDARY">'+
        '<div style="font-size:10px;color:var(--amb);letter-spacing:.15em">СЕКРЕТНЫЙ КОНТРАКТ</div>'+
        '<h3>'+c.rune_name+' × '+c.count+'</h3>'+
        '<div class="row"><span>Награда</span><b style="color:var(--grn)">'+fmt(c.reward+c.bonus)+'</b></div>'+
        '<div class="row"><span>Бонус</span><b class="up">+'+fmt(c.bonus)+'</b></div>'+
        '<div class="row"><span>Истекает</span><b>'+left(c.left)+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-rc-accept="'+c.id+'">ПРИНЯТЬ</button></div>'+
        '</article>';
    }).join(''):'<div class="empty">ЗАКАЗОВ НЕТ</div>')+'</div>';
}
function renderInventory(){
  let items=S.inv;
  if(ui.invFilter==='ITEM')items=items.filter(x=>!x.rune&&!x.vehicle&&!x.weapon&&x.cat!=='MERC'&&x.cat!=='ARMOR'&&x.cat!=='CONVOY_CASE');
  else if(ui.invFilter==='VEHICLE')items=items.filter(x=>x.vehicle||x.cat==='VEHICLE');
  else if(ui.invFilter==='WEAPON')items=items.filter(x=>x.weapon||x.cat==='WEAPON');
  else if(ui.invFilter==='ARMOR')items=items.filter(x=>x.cat==='ARMOR');
  else if(ui.invFilter==='MERC')items=items.filter(x=>x.cat==='MERC');
  else if(ui.invFilter==='RUNE')items=items.filter(x=>x.rune);
  else if(ui.invFilter==='CASE')items=items.filter(x=>x.case||x.cat==='CONVOY_CASE');
  $('#view').innerHTML='<h2 class="pt">МОЙ ИНВЕНТАРЬ · '+S.inv.length+'</h2>'+
    '<div class="bar" style="margin-bottom:12px">'+INV_FILTERS.map(c=>'<button class="chip '+(c[0]===ui.invFilter?'on':'')+'" data-inv="'+c[0]+'">'+c[1]+'</button>').join('')+'</div>'+
    '<div class="grid">'+
    (items.length?items.map(i=>{
      const d=(i.val||i.bought)-(i.bought||0);
      const extra=i.power?'<div class="row"><span>Сила</span><b>'+i.power+'</b></div>':'';
      return '<article class="card r-'+i.rarity+'"><div class="art"><i></i></div>'+
        '<h3>'+i.name+'</h3>'+
        '<div class="row"><span>Редкость</span><b>'+(RAR_RU[i.rarity]||i.rarity)+'</b></div>'+
        extra+
        '<div class="row"><span>Куплено</span><b>'+fmt(i.bought||0)+'</b></div>'+
        '<div class="row"><span>Сейчас</span><b>'+fmt(i.val||i.bought||0)+'</b></div>'+
        '<div class="row"><span>П/У</span><b class="'+(d>=0?'up':'dn')+'">'+(d>=0?'+':'')+fmt(d)+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-sell="'+i.uid+'">ПРОДАТЬ</button></div></article>';
    }).join(''):'<div class="empty">ИНВЕНТАРЬ ПУСТ</div>')+'</div>';
}
function renderMercenaries(){
  $('#view').innerHTML='<h2 class="pt">НАЁМНИКИ · КАТАЛОГ</h2>'+
    '<div style="font-size:11px;color:var(--mut);margin-bottom:12px">Наёмники усиливают конвой. Чем выше ранг — тем больше силы.</div>'+
    '<div class="grid">'+MERCENARIES.map(m=>{
      const have=S.inv.filter(x=>x.name===m[0]&&x.cat==='MERC').length;
      return '<article class="card r-'+m[3]+'">'+
        '<div class="art"><i></i></div>'+
        '<h3>'+m[0]+'</h3>'+
        '<div class="row"><span>Ранг</span><b>'+(RAR_RU[m[3]]||m[3])+'</b></div>'+
        '<div class="row"><span>Сила</span><b>'+m[2]+'</b></div>'+
        '<div class="row"><span>Цена</span><b style="color:var(--grn)">'+fmt(m[1])+'</b></div>'+
        '<div class="row"><span>У вас</span><b>'+have+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-merc="'+m[0]+'">НАНЯТЬ</button></div>'+
        '</article>';
    }).join('')+'</div>';
}
function renderProfile(){
  const worth=S.bal+S.inv.reduce((s,i)=>s+(i.val||i.bought||0),0);
  const profit=worth-100000;
  const sndOn=SND.on();
  const cp=convoyPower();
  const cc=convoyChance();
  const cr=convoyReward();
  const veh=S.convoy.vehicle?S.inv.find(x=>x.uid==S.convoy.vehicle):null;
  $('#view').innerHTML='<h2 class="pt">ПРОФИЛЬ</h2>'+
    '<div class="pf-h"><div class="av">👤</div><div class="pf-n"><b>'+S.user+'</b><small>РЕПУТАЦИЯ: '+S.rep+'</small><small style="color:var(--mut);margin-top:3px">ID: '+TG_ID+'</small></div></div>'+
    '<div class="stats"><div class="stat"><small>СОСТОЯНИЕ</small><b>'+fmt(worth)+'</b></div>'+
    '<div class="stat"><small>ПРИБЫЛЬ</small><b class="'+(profit>=0?'up':'dn')+'">'+(profit>=0?'+':'')+fmt(profit)+'</b></div>'+
    '<div class="stat"><small>СДЕЛОК</small><b>'+S.tx.length+'</b></div>'+
    '<div class="stat"><small>ИНВЕНТАРЬ</small><b>'+S.inv.length+'</b></div></div>'+
    '<div class="ft" style="margin-bottom:14px"><button class="btn '+(sndOn?'pri':'')+'" id="snd-btn">ЗВУК: '+(sndOn?'ВКЛ':'ВЫКЛ')+'</button></div>'+
    '<h2 class="pt">КОНВОЙ</h2>'+
    '<div class="card" style="margin-bottom:14px">'+
    '<div style="font-size:10px;color:var(--amb);letter-spacing:.2em">ВОЕННЫЙ РЕЙД · РАЗГРАБЛЕНИЕ СКЛАДА</div>'+
    '<h3>СОСТАВ КОНВОЯ</h3>'+
    '<div class="line" style="cursor:pointer" data-convoy-pick="vehicle"><span>МАШИНА</span><b>'+(veh?veh.name+' (сила '+veh.power+')':'<span style="color:var(--red)">НЕ ВЫБРАНА</span>')+'</b></div>'+
    '<div class="line" style="cursor:pointer" data-convoy-pick="mercenary"><span>НАЁМНИКИ</span><b>'+S.convoy.mercenaries.length+' / 4</b></div>'+
    '<div class="line" style="cursor:pointer" data-convoy-pick="weapon"><span>ОРУЖИЕ</span><b>'+S.convoy.weapons.length+' / 3</b></div>'+
    '<div class="line" style="cursor:pointer" data-convoy-pick="armor"><span>БРОНЯ</span><b>'+S.convoy.armor.length+' / 3</b></div>'+
    '<div class="line"><span>СИЛА КОНВОЯ</span><b class="up">'+cp+'</b></div>'+
    '<div class="line"><span>ШАНС УСПЕХА</span><b class="up">'+cc+'%</b></div>'+
    '<div class="line"><span>НАГРАДА ПРИ УСПЕХЕ</span><b style="color:var(--grn)">'+fmt(cr)+' + КЕЙС</b></div>'+
    '<span style="font-size:10px;color:var(--red);display:block;margin-top:8px">⚠ Компоненты тратятся независимо от исхода</span>'+
    '<div class="ft"><button class="btn pri" data-convoy-start '+(veh?'':'disabled')+'>НАЧАТЬ РЕЙД</button></div>'+
    '</div>'+
    '<h2 class="pt">КРАФТ</h2>'+
    Object.keys(RCP).map(k=>{
      const r=RCP[k];
      const have=S.inv.filter(x=>x.rarity===r.from).length;
      return '<div class="card" style="margin-bottom:12px">'+
        '<h3>'+r.title+'</h3>'+
        '<div class="row"><span>Шанс успеха</span><b class="up">'+r.chance+'</b></div>'+
        '<div class="row"><span>Материалов у вас</span><b>'+have+' / '+r.need+'</b></div>'+
        '<div class="ft"><button class="btn pri" data-craft="'+k+'" '+(have>=r.need?'':'disabled')+'>СОЗДАТЬ</button></div>'+
        '</div>';
    }).join('')+
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
  if(tab){ui.page=tab.dataset.page;render();return}
  const cat=e.target.closest('[data-cat]');
  if(cat){ui.cat=cat.dataset.cat;renderMarket();return}
  const inv=e.target.closest('[data-inv]');
  if(inv){ui.invFilter=inv.dataset.inv;renderInventory();return}
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
  const ra=e.target.closest('[data-rc-accept]');
  if(ra){rcAccept(ra.dataset.rcAccept);return}
  const rd=e.target.closest('[data-rc-done]');
  if(rd){rcDone(rd.dataset.rcDone);return}
  const rd2=e.target.closest('[data-rc-drop]');
  if(rd2){rcDrop(rd2.dataset.rcDrop);return}
  const cr=e.target.closest('[data-craft]');
  if(cr){craftModal(cr.dataset.craft);return}
  const cs=e.target.closest('[data-case]');
  if(cs){caseModal(cs.dataset.case);return}
  const stb=e.target.closest('[data-stars]');
  if(stb){buyStars(stb.dataset.stars);return}
  const pm=e.target.closest('[data-promo]');
  if(pm){redeemPromo();return}
  const merc=e.target.closest('[data-merc]');
  if(merc){const m=MERCENARIES.find(x=>x[0]===merc.dataset.merc);if(m)buyMerc(m[0],m[1]);return}
  const cpick=e.target.closest('[data-convoy-pick]');
  if(cpick){pickForConvoy(cpick.dataset.convoyPick);return}
  const cstart=e.target.closest('[data-convoy-start]');
  if(cstart){startConvoy();return}
  if(e.target.closest('#bell')){
    unread=0;badge();
    modal('<h4>УВЕДОМЛЕНИЯ</h4>'+(notes.slice(0,10).map(x=>'<div class="line"><span>'+x.title+'</span><b style="font-size:11px">'+x.msg+'</b></div>').join('')||'<div class="empty">ПУСТО</div>'));
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

setInterval(()=>{
  const r=MARKET.raid||{active:false,left:0};
  const t=$('#rd-t'),bar=$('#rd-i');
  if(r.active){
    if(t)t.textContent='торги приостановлены · осталось '+r.left+' с';
    if(bar)bar.style.width=Math.max(0,Math.min(100,r.left/60*100))+'%';
  }
},1000);

function boot(){
  const lines=['СОЕДИНЕНИЕ...','ШИФРОВАНИЕ СЕССИИ...','УСТАНОВКА ЗАЩИЩЁННОГО КАНАЛА...'];
  const L=$('#ld-line');
  let i=0;
  (function nx(){
    if(i<lines.length){
      L.textContent=lines[i++];
      setTimeout(nx,700);
    }else{
      L.textContent='КАНАЛ ГОТОВ';
      $('#enter').hidden=false;
    }
  })();
  Promise.all([loadState().catch(()=>{}),loadMarket().catch(()=>{}),loadAuctions().catch(()=>{}),loadContracts().catch(()=>{}),loadRuneContracts().catch(()=>{})]).then(()=>{if(entered)render()});
  $('#enter').addEventListener('click',()=>{
    entered=true;
    $('#loader').style.opacity='0';
    setTimeout(()=>{
      $('#loader').remove();
      $('#app').classList.remove('hidden');
      render();
      showNotification('ДОБРО ПОЖАЛОВАТЬ','Сессия открыта');
      setInterval(async()=>{
        const ae=document.activeElement;
        if(!ui.open&&!(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'))){
          await Promise.all([loadMarket().catch(()=>{}),loadAuctions().catch(()=>{}),loadContracts().catch(()=>{}),loadRuneContracts().catch(()=>{}),loadState().catch(()=>{})]);
          render();
        }else{hdr();}
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
    const tu=tg.initDataUnsafe&&tg.initDataUnsafe.user;
    if(tu){const fn=((tu.first_name||'')+' '+(tu.last_name||'')).trim();if(fn)S.user=fn;else if(tu.username)S.user=tu.username}
    if(tg.initData){
      fetch('/api/tg/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:tg.initData})})
        .then(r=>r.json()).then(d=>{if(d&&d.valid){TG_ID=d.tg_id;loadState().catch(()=>{}).then(()=>{if(entered)render()})}}).catch(()=>{});
    }
  }
  boot();
})();
