'use strict';
// ==================== ЯДРО: работа с сервером ====================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => '₽ ' + Math.round(n).toLocaleString('ru-RU');
const pct = c => (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
const left = ts => {
  const s = Math.max(0, Math.floor(ts));
  return s > 3600 ? `${Math.floor(s/3600)}ч ${Math.floor(s%3600/60)}м` :
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
};

// Глобальное состояние (загружается с сервера)
let S = { bal: 100000, inv: [], tx: [], user: '' };
let TG_ID = '';
let USERNAME = '';
let ui = { page: 'market', cat: 'ALL', open: null };
let notes = [], unread = 0;
let MARKET = { products: [], tick: 0 };
let AUCTIONS = [];

// ==================== API ====================
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: {} };
  if (TG_ID) opts.headers['X-TG-ID'] = TG_ID;
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  try {
    const r = await fetch(path, opts);
    return await r.json();
  } catch (e) {
    console.error('API error:', e);
    return { error: e.message };
  }
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(title, msg, kind = '') {
  notes.unshift({ title, msg, t: Date.now() });
  unread++;
  badge();
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = `<b>${title}</b><span>${msg}</span>`;
  $('#toasts').prepend(t);
  while ($('#toasts').children.length > 4) $('#toasts').lastChild.remove();
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 4000);
}

function badge() {
  const b = $('#badge');
  if (b) { b.hidden = !unread; b.textContent = unread; }
}

// ==================== МОДАЛКИ ====================
function modal(html, cls = '') {
  $$('.modal').forEach(m => m.remove());
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="sheet ${cls}">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal() });
  $('#modals').append(m);
  requestAnimationFrame(() => m.classList.add('on'));
  return m;
}

function closeModal() {
  ui.open = null;
  const m = $('.modal');
  if (m) { m.classList.remove('on'); setTimeout(() => m.remove(), 250) }
}

// ==================== ЗАГРУЗКА / СОХРАНЕНИЕ ====================
async function loadState() {
  if (!TG_ID) return;
  const data = await api('/api/state');
  if (data && !data.error) {
    S.bal = data.balance ?? 100000;
    const st = data.state || {};
    S.inv = st.inv || [];
    S.tx = st.tx || [];
    S.user = data.username || 'TRADER';
  }
}

async function saveToServer() {
  if (!TG_ID) return;
  await api('/api/action', 'POST', {
    action: 'save',
    state: { inv: S.inv, tx: S.tx }
  });
}

async function loadMarket() {
  const data = await api('/api/market');
  if (data && data.products) {
    MARKET = data;
  }
}

async function loadAuctions() {
  const data = await api('/api/auctions');
  if (data && data.auctions) {
    AUCTIONS = data.auctions;
  }
}

// ==================== ДЕЙСТВИЯ ====================
async function buyProduct(product) {
  const pr = Math.round(product.price);
  if (S.bal < pr) return showNotification('НЕДОСТАТОЧНО СРЕДСТВ', 'Баланс слишком мал', 'dn');

  const resp = await api('/api/action', 'POST', {
    action: 'buy',
    price: pr,
    item: { name: product.name, rarity: product.rarity, cat: product.cat, hue: Math.floor(Math.random() * 360) }
  });

  if (resp.ok) {
    S.bal = resp.balance;
    showNotification('ПОКУПКА ЗАВЕРШЕНА', `${product.name} добавлен в инвентарь`, 'up');
    closeModal();
    render();
    saveToServer();
  } else {
    showNotification('ОШИБКА', resp.msg || 'Покупка не удалась', 'dn');
  }
}

async function sellProduct(uid, price) {
  price = Math.round(price);
  if (!(price > 0)) return showNotification('НЕВЕРНАЯ ЦЕНА', 'Введите корректную цену', 'dn');

  const resp = await api('/api/action', 'POST', { action: 'sell', uid, price });
  if (resp.ok) {
    S.bal = resp.balance;
    const item = S.inv.find(x => x.uid == uid);
    S.inv = S.inv.filter(x => x.uid != uid);
    S.tx.unshift({ t: Date.now(), type: 'SELL', item: item?.name || '', amount: price });
    showNotification('ПРОДАЖА ЗАВЕРШЕНА', `Продано за ${fmt(price)}`, 'up');
    closeModal();
    render();
    saveToServer();
  } else {
    showNotification('ОШИБКА', resp.msg || 'Продажа не удалась', 'dn');
  }
}

function sellModal(uid) {
  const i = S.inv.find(x => x.uid == uid);
  if (!i) return showNotification('ОШИБКА', 'Предмета нет', 'dn');
  modal(`
    <h4>ПРОДАЖА ПРЕДМЕТА</h4>
    <div class="line"><span>ПРЕДМЕТ</span><b>${i.name}</b></div>
    <div class="line"><span>КУПЛЕНО ЗА</span><b>${fmt(i.bought || 0)}</b></div>
    <span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">ВАША ЦЕНА</span>
    <input class="inp" id="ask" type="number" min="1" value="${Math.round((i.val || i.bought || 1000) * 1.1)}">
    <div class="acts">
      <button class="btn" onclick="closeModal()">ОТМЕНА</button>
      <button class="btn pri" onclick="sellProduct(${uid}, $('#ask').value)">ПРОДАТЬ</button>
    </div>
  `);
}

function confirmBuy(product) {
  const pr = Math.round(product.price);
  modal(`
    <h4>ПОДТВЕРЖДЕНИЕ ПОКУПКИ</h4>
    <div class="line"><span>ПРЕДМЕТ</span><b>${product.name}</b></div>
    <div class="line"><span>ЦЕНА</span><b>${fmt(pr)}</b></div>
    <div class="line"><span>БАЛАНС</span><b>${fmt(S.bal)}</b></div>
    <div class="line"><span>ПОСЛЕ ПОКУПКИ</span><b class="${S.bal - pr < 0 ? 'dn' : 'grn'}">${fmt(S.bal - pr)}</b></div>
    <div class="acts">
      <button class="btn" onclick="closeModal()">ОТМЕНА</button>
      <button class="btn pri" id="buy-btn">КУПИТЬ</button>
    </div>
  `);
  $('#buy-btn').onclick = () => buyProduct(product);
}

// ==================== АУКЦИОНЫ ====================
async function placeBid(auctionId, amount) {
  amount = Math.round(amount);
  if (!(amount > 0)) return showNotification('ОШИБКА', 'Введите ставку', 'dn');

  const resp = await api('/api/action', 'POST', {
    action: 'bid', auction_id: auctionId, amount
  });

  if (resp.ok) {
    S.bal = resp.balance;
    showNotification('СТАВКА ПРИНЯТА', `Ставка ${fmt(amount)}`, 'up');
    closeModal();
    await loadAuctions();
    render();
    saveToServer();
  } else {
    showNotification('ОШИБКА', resp.msg || 'Ставка не принята', 'dn');
  }
}

function openAuction(auc) {
  ui.open = auc.id;
  const minBid = auc.bid + Math.max(100, Math.round(auc.start * 0.05));
  modal(`
    <h4>АУКЦИОН · ${auc.name}</h4>
    <div class="line"><span>РЕДКОСТЬ</span><b>${auc.rarity}</b></div>
    <div class="line"><span>СТАРТ</span><b>${fmt(auc.start)}</b></div>
    <div class="line"><span>ТЕКУЩАЯ СТАВКА</span><b style="font-size:18px;color:var(--grn)">${fmt(auc.bid)}</b></div>
    <div class="line"><span>ЛИДЕР</span><b>${auc.leader || '—'}</b></div>
    <div class="line"><span>СТАВОК</span><b>${auc.n}</b></div>
    <div class="line"><span>ОСТАЛОСЬ</span><b class="dn">${left(auc.left)}</b></div>
    <span style="font-size:11px;color:var(--mut);display:block;margin-top:12px">ВАША СТАВКА (мин. ${fmt(minBid)})</span>
    <input class="inp" id="bid-amt" type="number" min="${minBid}" value="${minBid}">
    <div class="acts">
      <button class="btn" onclick="closeModal()">ЗАКРЫТЬ</button>
      <button class="btn pri" id="bid-btn">СДЕЛАТЬ СТАВКУ</button>
    </div>
  `);
  $('#bid-btn').onclick = () => placeBid(auc.id, +$('#bid-amt').value);
}

// ==================== ЗАПУСК ====================
async function boot() {
  // Лоадер крутится сразу, сервер не блокирует вход
  const lines = ['CONNECTING...', 'ENCRYPTING SESSION...', 'ESTABLISHING SECURE CHANNEL...'];
  const L = $('#ld-line');
  let i = 0;
  (function nx() {
    if (i < lines.length) { L.textContent = lines[i++]; setTimeout(nx, 700); }
    else { L.textContent = 'CHANNEL READY'; $('#enter').hidden = false; }
  })();

  // Данные грузятся в фоне
  loadState().catch(() => {});
  loadMarket().catch(() => {});
  loadAuctions().catch(() => {});

  $('#enter').addEventListener('click', () => {
    $('#loader').style.opacity = '0';
    setTimeout(() => {
      $('#loader').remove();
      $('#app').classList.remove('hidden');
      render();
      showNotification('ДОБРО ПОЖАЛОВАТЬ', 'Сессия открыта');
      setInterval(() => {
        loadMarket().catch(() => {});
        loadAuctions().catch(() => {});
        if (!ui.open && ui.page === 'market') renderGrid();
        if (ui.page === 'auctions') renderAuctions();
        hdr();
      }, 5000);
    }, 800);
  });
}
  // Инициализация (вызывается из telegram.js или напрямую)
  await loadState();
  await loadMarket();
  await loadAuctions();

  // Лоадер
  const lines = ['CONNECTING...', 'ENCRYPTING SESSION...', 'ESTABLISHING SECURE CHANNEL...'];
  const L = $('#ld-line');
  let i = 0;
  await new Promise(res => {
    (function nx() {
      if (i < lines.length) { L.textContent = lines[i++]; setTimeout(nx, 700); }
      else { L.textContent = 'CHANNEL READY'; $('#enter').hidden = false; res(); }
    })();
  });

  $('#enter').addEventListener('click', async () => {
    $('#loader').style.opacity = '0';
    setTimeout(async () => {
      $('#loader').remove();
      $('#app').classList.remove('hidden');
      render();
      showNotification('ДОБРО ПОЖАЛОВАТЬ', `Сессия открыта`);

      // Обновление каждые 5 секунд
      setInterval(async () => {
        await loadMarket();
        await loadAuctions();
        if (!ui.open && ui.page === 'market') renderGrid();
        if (ui.page === 'auctions') renderAuctions();
        hdr();
      }, 5000);
    }, 800);
  });
}
