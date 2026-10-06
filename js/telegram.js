'use strict';
// Простая Telegram-интеграция без серверной валидации (для тестов)
(function () {
  const isTG = window.Telegram && window.Telegram.WebApp;

  if (isTG) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Тема Telegram
    if (tg.themeParams) {
      const tp = tg.themeParams;
      if (tp.bg_color) document.documentElement.style.setProperty('--bg', tp.bg_color);
      if (tp.text_color) document.documentElement.style.setProperty('--tx', tp.text_color);
      if (tp.button_color) document.documentElement.style.setProperty('--amb', tp.button_color);
    }

    // Имя пользователя
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const u = tg.initDataUnsafe.user;
      S.user = u.username || u.first_name || 'TRADER';
    }
  }

  // Запуск игры
  boot();
})();