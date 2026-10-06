'use strict';
(function () {
  // Гостевой ID — игра работает сразу, даже без сервера
  TG_ID = 'guest_' + (localStorage.getItem('bm_guest') || Math.random().toString(36).slice(2));
  localStorage.setItem('bm_guest', TG_ID);
  S.user = 'GUEST';

  const isTG = window.Telegram && window.Telegram.WebApp;
  if (isTG) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    if (tg.themeParams) {
      const tp = tg.themeParams;
      if (tp.bg_color) document.documentElement.style.setProperty('--bg', tp.bg_color);
      if (tp.text_color) document.documentElement.style.setProperty('--tx', tp.text_color);
      if (tp.button_color) document.documentElement.style.setProperty('--amb', tp.button_color);
    }
    // В фоне: сервер проверяет initData и выдаёт настоящий ID
    if (tg.initData) {
      fetch('/api/tg/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData })
      }).then(r => r.json()).then(d => {
        if (d.valid) { TG_ID = d.tg_id; S.user = d.username || 'TRADER'; hdr(); }
      }).catch(() => {});
    }
  }
  boot();
})();
