'use strict';
// ==================== РЕНДЕР ====================
function render() {
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.page === ui.page));
  const pages = { market: renderMarket, inventory: renderInventory, auctions: renderAuctions, profile: renderProfile };
  (pages[ui.page] || renderMarket)();
  hdr();
}

function hdr() {
  const bal = $('#bal');
  if (bal) bal.textContent = fmt(S.bal);
}

// ==================== РЫНОК ====================
function card(p) {
  const c = ((p.price / p.base) - 1) * 100;
  return `
    <article class="card r-${p.rarity}" onclick="openProduct('${p.id}')">
      <div class="art"><i></i></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)">
        <span>${p.rarity}</span><span>${p.id}</span>
      </div>
      <h3>${p.name}</h3>
      <div class="row"><span>Продавец</span><b>${p.seller}</b></div>
      <div class="row"><span>Цена</span><b style="color:var(--grn)">${fmt(p.price)}</b></div>
      <div class="row"><span>Изменение</span><b class="${c >= 0 ? 'up' : 'dn'}">${pct(c)}</b></div>
      <div class="ft" onclick="event.stopPropagation()">
        <button class="btn pri" onclick="confirmBuy(MARKET.products.find(x=>x.id==='${p.id}'))">КУПИТЬ</button>
      </div>
    </article>`;
}

function renderGrid() {
  const g = $('#grid');
  if (!g) return;
  let items = MARKET.products;
  if (ui.cat !== 'ALL') items = items.filter(p => p.cat === ui.cat);
  g.innerHTML = items.length ? items.map(card).join('') : '<div class="empty">НЕТ ЛОТОВ</div>';
}

function renderMarket() {
  $('#view').innerHTML = `
    <h2 class="pt">ОБЗОР РЫНКА · ОБЩИЙ ДЛЯ ВСЕХ</h2>
    <div class="stats">
      <div class="stat"><small>ЛОТЫ</small><b>${MARKET.products.length}</b></div>
      <div class="stat"><small>БАЛАНС</small><b>${fmt(S.bal)}</b></div>
      <div class="stat"><small>ТИК</small><b>#${MARKET.tick || 0}</b></div>
      <div class="stat"><small>ИНВЕНТАРЬ</small><b>${S.inv.length}</b></div>
    </div>
    <div class="bar">
      ${['ALL','TECH','ARTIFACTS','COLLECTIBLES','VEHICLES','DEVICES'].map(c =>
        `<button class="chip ${c === ui.cat ? 'on' : ''}" onclick="setCat('${c}')">${c}</button>`).join('')}
    </div>
    <div id="grid" class="grid"></div>`;
  renderGrid();
}

function setCat(c) { ui.cat = c; renderGrid(); $$('.chip').forEach(ch => ch.classList.toggle('on', ch.textContent === c)); }

function openProduct(id) {
  const p = MARKET.products.find(x => x.id === id);
  if (!p) return;
  ui.open = id;
  const c = ((p.price / p.base) - 1) * 100;
  modal(`
    <h4>${p.name}</h4>
    <div class="art" style="height:120px;background:#0a0b0e;display:grid;place-items:center;border-radius:8px;margin-bottom:16px">
      <i style="width:60px;height:60px;border:1px solid var(--rc);transform:rotate(45deg)"></i>
    </div>
    <div class="line"><span>ID</span><b>${p.id}</b></div>
    <div class="line"><span>РЕДКОСТЬ</span><b>${p.rarity}</b></div>
    <div class="line"><span>ЦЕНА</span><b style="font-size:18px;color:var(--grn)">${fmt(p.price)}</b></div>
    <div class="line"><span>ИЗМЕНЕНИЕ</span><b class="${c >= 0 ? 'up' : 'dn'}">${pct(c)}</b></div>
    <div class="line"><span>ПРОДАВЕЦ</span><b>${p.seller}</b></div>
    <div class="line"><span>ПРЕДЛОЖЕНИЕ</span><b>${p.sup} шт</b></div>
    <div class="line"><span>ПРОСМОТРЫ</span><b>${p.views}</b></div>
    <div class="acts">
      <button class="btn" onclick="closeModal()">ЗАКРЫТЬ</button>
      <button class="btn pri" id="m-buy">КУПИТЬ</button>
    </div>`);
  $('#m-buy').onclick = () => { closeModal(); confirmBuy(p); };
}

// ==================== ИНВЕНТАРЬ ====================
function renderInventory() {
  $('#view').innerHTML = `
    <h2 class="pt">МОЙ ИНВЕНТАРЬ · ${S.inv.length}</h2>
    <div class="grid">
      ${S.inv.length ? S.inv.map(i => `
        <article class="card r-${i.rarity}">
          <div class="art"><i></i></div>
          <h3>${i.name}</h3>
          <div class="row"><span>Куплено</span><b>${fmt(i.bought || 0)}</b></div>
          <div class="row"><span>Сейчас</span><b>${fmt(i.val || i.bought || 0)}</b></div>
          <div class="ft">
            <button class="btn pri" onclick="sellModal(${i.uid})">ПРОДАТЬ</button>
          </div>
        </article>`).join('') : '<div class="empty">ИНВЕНТАРЬ ПУСТ</div>'}
    </div>`;
}

// ==================== АУКЦИОНЫ ====================
function renderAuctions() {
  $('#view').innerHTML = `
    <h2 class="pt">АУКЦИОНЫ</h2>
    <div class="empty">АУКЦИОНЫ В РАЗРАБОТКЕ<br><small>Скоро появятся</small></div>
  `;
}

// ==================== ПРОФИЛЬ ====================
function renderProfile() {
  const worth = S.bal + S.inv.reduce((s, i) => s + (i.val || i.bought || 0), 0);
  const profit = worth - 100000;
  $('#view').innerHTML = `
    <h2 class="pt">ПРОФИЛЬ</h2>
    <div class="pf-h">
      <div class="av">👤</div>
      <div class="pf-n">
        <b>${S.user || 'TRADER'}</b>
        <small>ID: ${TG_ID || 'guest'}</small>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><small>СОСТОЯНИЕ</small><b>${fmt(worth)}</b></div>
      <div class="stat"><small>ПРИБЫЛЬ</small><b class="${profit >= 0 ? 'up' : 'dn'}">${profit >= 0 ? '+' : ''}${fmt(profit)}</b></div>
      <div class="stat"><small>СДЕЛОК</small><b>${S.tx.length}</b></div>
      <div class="stat"><small>ИНВЕНТАРЬ</small><b>${S.inv.length}</b></div>
    </div>
    <h2 class="pt">ПОСЛЕДНИЕ СДЕЛКИ</h2>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${S.tx.slice(0, 15).map(t => `
        <div class="line">
          <span>${new Date(t.t * 1000).toLocaleTimeString('ru-RU')} · ${t.type}</span>
          <b class="${t.amount > 0 ? 'up' : t.amount < 0 ? 'dn' : ''}">${t.amount ? (t.amount > 0 ? '+' : '-') + fmt(Math.abs(t.amount)) : ''}</b>
        </div>`).join('') || '<div class="empty">НЕТ СДЕЛОК</div>'}
    </div>`;
}

// ==================== НАВИГАЦИЯ ====================
document.addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (tab) { ui.page = tab.dataset.page; render(); }
  if (e.target.closest('#bell')) {
    unread = 0; badge();
    modal(`<h4>УВЕДОМЛЕНИЯ</h4>
      ${notes.slice(0, 10).map(x => `<div class="line"><span>${x.title}</span><b style="font-size:11px">${x.msg}</b></div>`).join('') || '<div class="empty">ПУСТО</div>'}`);
  }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() });