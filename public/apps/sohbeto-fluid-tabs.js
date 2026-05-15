/* ============================================================
   SOHBETO FLUID TABS  v1 — Adım 5 (Telegram benzeri tab geçişleri)
   Motoru ve ana adapter'ı kirletmez. Sadece 4 ana sekme arasında
   (sohbetler, kişiler, gruplar, ayarlar) yönlü kayma + parmak swipe.
   YÜKLEME: sohbeto-engine.js'TEN SONRA. Tema HTML'inde stub'lar
   (#screen-sohbetler vs.) ve `app.navigate` zaten varsa otomatik bağlanır.
   ============================================================ */
(function () {
  'use strict';

  var TABS = ['sohbetler', 'kisiler', 'gruplar', 'ayarlar'];
  var SCREEN_IDS = TABS.map(function (t) { return 'screen-' + t; });
  // Kayma eşikleri: Telegram benzeri akışkanlık
  var DURATION_MS = 319;
  var EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  var SWIPE_DISTANCE_RATIO = 0.18;   // genişliğin %18'inden fazlaysa geç
  var SWIPE_VELOCITY = 0.45;          // px/ms — bunu aşan hızlı flick yeter
  var DRAG_RUBBER = 0.35;             // uçlarda elastik direnç
  var TAP_HORIZ_THRESHOLD = 8;        // px — bu altı tap sayılır
  var DECIDE_RATIO = 1.4;             // |dx| > |dy|*1.4 → yatay kabul

  function ready(fn) {
    // Adapter, window.app.navigate'i `window.load` üzerinde kuruyor (DOMContentLoaded'dan
    // SONRA). Bizim patch'imiz adapter'ın atamasını ezerse → kayıp. Bu yüzden
    // hem `load`'u bekliyoruz hem de `window.app.navigate` tanımlanana kadar
    // kısa bir polling ile bekliyoruz; en geç ~3 sn sonra fallback.
    function start() {
      var tries = 0;
      (function wait() {
        if (window.app && typeof window.app.navigate === 'function') return fn();
        if (++tries > 60) return fn(); // ~3sn sonra her halükarda dene
        setTimeout(wait, 50);
      })();
    }
    if (document.readyState === 'complete') setTimeout(start, 0);
    else window.addEventListener('load', start, { once: true });
  }

  function injectStyles() {
    if (document.getElementById('__fluid_tabs_css__')) return;
    var css = [
      '.app-container{overflow:hidden;}',
      // 4 ana sekme: yatay kaymaya hazır, transition yumuşak
      SCREEN_IDS.map(function (id) { return '#' + id; }).join(',') +
        '{transition:transform ' + DURATION_MS + 'ms ' + EASING + ';will-change:transform;}',
      // Drag esnasında transition kapalı
      '.app-container.fluid-dragging ' + SCREEN_IDS.map(function (id) { return '#' + id; }).join(',.app-container.fluid-dragging ') +
        '{transition:none !important;}',
      // Fluid mode'da tüm tab'lar görünür kalır; ana mantık transform ile yönetilir
      '.app-container.fluid-mode ' + SCREEN_IDS.map(function (id) { return '#' + id + '.hidden-screen'; }).join(',.app-container.fluid-mode ') +
        '{opacity:1;pointer-events:auto;}',
      // Aktif olmayan sekmeler input almasın
      '.app-container.fluid-mode .fluid-inactive{pointer-events:none;}',
    ].join('\n');
    var style = document.createElement('style');
    style.id = '__fluid_tabs_css__';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getTabScreens() {
    return SCREEN_IDS.map(function (id) { return document.getElementById(id); });
  }

  // ---------- Aktif index yönetimi ----------
  var activeIndex = 0; // sohbetler default
  var dragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragLastX = 0;
  var dragLastT = 0;
  var dragVelocity = 0;
  var horizontalLocked = null; // null=karar verilmedi, true=yatay, false=dikey
  var containerWidth = 0;
  var appContainer = null;

  function setActiveByIndex(idx, animate) {
    idx = Math.max(0, Math.min(TABS.length - 1, idx));
    activeIndex = idx;
    var screens = getTabScreens();
    appContainer.classList.add('fluid-mode');
    screens.forEach(function (el, i) {
      if (!el) return;
      el.classList.remove('hidden-screen');
      el.classList.add('active'); // engine bazı yerlerde .active arıyor
      if (i === idx) el.classList.remove('fluid-inactive');
      else el.classList.add('fluid-inactive');
      el.style.transform = 'translateX(' + ((i - idx) * 100) + '%)';
    });
    // Alt nav state
    try {
      document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
      var navEl = document.getElementById('nav-' + TABS[idx]);
      if (navEl) navEl.classList.add('active');
    } catch (e) {}
    // Engine'in renderConvList / renderContacts gibi tetiklemelerini kaybetmeyelim
    var name = TABS[idx];
    try {
      if (name === 'kisiler' && typeof window.renderContacts === 'function') window.renderContacts();
      if (name === 'sohbetler' && typeof window.renderConvList === 'function') window.renderConvList();
    } catch (e) {}
  }

  function leaveFluidMode() {
    if (!appContainer) return;
    appContainer.classList.remove('fluid-mode');
    appContainer.classList.remove('fluid-dragging');
    var screens = getTabScreens();
    screens.forEach(function (el, i) {
      if (!el) return;
      el.style.transform = '';
      el.classList.remove('fluid-inactive');
      // Aktif olmayanları gizle (orijinal davranışa dön)
      if (i !== activeIndex) el.classList.add('hidden-screen');
    });
  }

  // ---------- app.navigate köprüsü ----------
  function patchNavigate() {
    var orig = (window.app && window.app.navigate) ? window.app.navigate : null;
    window.app = window.app || {};
    window.app.navigate = function (target) {
      var idx = TABS.indexOf(target);
      if (idx === -1) {
        // Sohbet/arama gibi tam-ekran katmanlara geçiş: fluid'i terk et
        leaveFluidMode();
        if (typeof orig === 'function') return orig.apply(this, arguments);
        // orijinal yoksa minimal davran: tüm screen'leri gizle, hedefi göster
        document.querySelectorAll('.app-container > .screen').forEach(function (s) {
          s.classList.add('hidden-screen'); s.classList.remove('active');
        });
        var t = document.getElementById('screen-' + target) || document.getElementById(target);
        if (t) { t.classList.remove('hidden-screen'); t.classList.add('active'); }
        return;
      }
      // Bir sekmeden başka sekmeye → akışkan kayma
      // Diğer overlay ekranlarını (chat, ooCall, vs.) kapatmak orijinal navigate'in işi olabilir;
      // burada sadece tab grubunu yönetiyoruz. Eğer fluid mode değilse önce bir kez kur.
      setActiveByIndex(idx, true);
    };
  }

  // ---------- Touch / Pointer swipe ----------
  function shouldIgnoreTarget(target) {
    if (!target) return false;
    // Input/textarea/contenteditable üstünde swipe başlatma
    var tag = (target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return true;
    if (target.isContentEditable) return true;
    // Yatay kaydırılan (örn. scroll-x) bir element içindeysek bırak
    var el = target;
    while (el && el !== document.body) {
      var ov = getComputedStyle(el).overflowX;
      if ((ov === 'auto' || ov === 'scroll') && el.scrollWidth > el.clientWidth) return true;
      el = el.parentElement;
    }
    return false;
  }

  function isFluidMode() {
    return appContainer && appContainer.classList.contains('fluid-mode');
  }

  function getEventX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
  function getEventY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

  function onStart(e) {
    if (!isFluidMode()) return;
    if (e.touches && e.touches.length > 1) return;
    if (shouldIgnoreTarget(e.target)) return;
    dragStartX = dragLastX = getEventX(e);
    dragStartY = getEventY(e);
    dragLastT = performance.now();
    dragVelocity = 0;
    horizontalLocked = null;
    dragging = true;
    containerWidth = appContainer.clientWidth || window.innerWidth;
  }

  function onMove(e) {
    if (!dragging) return;
    var x = getEventX(e);
    var y = getEventY(e);
    var dx = x - dragStartX;
    var dy = y - dragStartY;
    if (horizontalLocked === null) {
      var ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax < TAP_HORIZ_THRESHOLD && ay < TAP_HORIZ_THRESHOLD) return;
      if (ax > ay * DECIDE_RATIO) {
        horizontalLocked = true;
        appContainer.classList.add('fluid-dragging');
      } else {
        horizontalLocked = false;
        dragging = false; // dikey kaydırmaya bırak
        return;
      }
    }
    if (!horizontalLocked) return;
    if (e.cancelable) e.preventDefault();
    // Kenarlarda elastik direnç
    var atLeft = activeIndex === 0 && dx > 0;
    var atRight = activeIndex === TABS.length - 1 && dx < 0;
    var effectiveDx = (atLeft || atRight) ? dx * DRAG_RUBBER : dx;
    var screens = getTabScreens();
    screens.forEach(function (el, i) {
      if (!el) return;
      var base = (i - activeIndex) * containerWidth;
      el.style.transform = 'translateX(' + (base + effectiveDx) + 'px)';
    });
    // Hız ölçümü
    var now = performance.now();
    var dt = now - dragLastT;
    if (dt > 0) dragVelocity = (x - dragLastX) / dt;
    dragLastX = x;
    dragLastT = now;
  }

  function onEnd() {
    if (!dragging) { horizontalLocked = null; return; }
    var wasHoriz = horizontalLocked === true;
    dragging = false;
    horizontalLocked = null;
    appContainer.classList.remove('fluid-dragging');
    if (!wasHoriz) return;
    var dx = dragLastX - dragStartX;
    var absDx = Math.abs(dx);
    var ratio = absDx / containerWidth;
    var fastFlick = Math.abs(dragVelocity) > SWIPE_VELOCITY && absDx > 12;
    var nextIdx = activeIndex;
    if ((ratio > SWIPE_DISTANCE_RATIO || fastFlick)) {
      if (dx < 0 && activeIndex < TABS.length - 1) nextIdx = activeIndex + 1;
      else if (dx > 0 && activeIndex > 0) nextIdx = activeIndex - 1;
    }
    setActiveByIndex(nextIdx, true);
  }

  function bindGestures() {
    if (!appContainer) return;
    // Pointer events tercih (mouse + touch + pen birleşik). Yoksa touch fallback.
    if (window.PointerEvent) {
      appContainer.addEventListener('pointerdown', onStart, { passive: true });
      appContainer.addEventListener('pointermove', onMove, { passive: false });
      appContainer.addEventListener('pointerup', onEnd, { passive: true });
      appContainer.addEventListener('pointercancel', onEnd, { passive: true });
    } else {
      appContainer.addEventListener('touchstart', onStart, { passive: true });
      appContainer.addEventListener('touchmove', onMove, { passive: false });
      appContainer.addEventListener('touchend', onEnd, { passive: true });
      appContainer.addEventListener('touchcancel', onEnd, { passive: true });
    }
  }

  // ---------- Bottom-nav görünür hale geldiğinde fluid mode'u kur ----------
  function watchNavReady() {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;
    var tryEnable = function () {
      if (nav.dataset.enabled === '1') {
        // Hangi sekme aktif? data'dan oku, yoksa sohbetler.
        var current = 0;
        TABS.forEach(function (t, i) {
          var el = document.getElementById('nav-' + t);
          if (el && el.classList.contains('active')) current = i;
        });
        // Sadece şu an gösterilen ekran tab grubundansa devreye gir
        var visibleTab = SCREEN_IDS.findIndex(function (id) {
          var el = document.getElementById(id);
          return el && !el.classList.contains('hidden-screen');
        });
        if (visibleTab !== -1) setActiveByIndex(visibleTab, false);
      }
    };
    // dataset değişimini gözlemle
    var obs = new MutationObserver(tryEnable);
    obs.observe(nav, { attributes: true, attributeFilter: ['data-enabled', 'style'] });
    tryEnable();
  }

  ready(function () {
    appContainer = document.querySelector('.app-container');
    if (!appContainer) {
      console.warn('[fluid-tabs] .app-container bulunamadı, devre dışı.');
      return;
    }
    injectStyles();
    patchNavigate();
    bindGestures();
    watchNavReady();
  });
})();
