/* ============================================================
   SOHBETO FLUID TABS  v2 — Adım 5 (Ultra-Smooth Telegram Deneyimi)
   Performans Odaklı: requestAnimationFrame, translate3d (GPU),
   DOM Caching ve gelişmiş Spring-Easing ile sıfır gecikme.
   ============================================================ */
(function () {
  'use strict';

  var TABS = ['sohbetler', 'kisiler', 'gruplar', 'ayarlar'];
  var SCREEN_IDS = TABS.map(function (t) { return 'screen-' + t; });
  
  // Telegram benzeri süper akıcı animasyon ayarları
  var DURATION_MS = 380; 
  // Agresif kalkış, ipek gibi iniş (Ease Out Expo türevi)
  var EASING = 'cubic-bezier(0.19, 1, 0.22, 1)'; 
  var SWIPE_DISTANCE_RATIO = 0.15;   // %15'i geçince sekme değişsin (daha hassas)
  var SWIPE_VELOCITY = 0.35;         // px/ms — çok hafif bir flick (fiske) yeterli
  var DRAG_RUBBER = 0.3;             // Uçlarda daha sert, tok bir yaylanma hissi
  var TAP_HORIZ_THRESHOLD = 5;       // Titremeleri önlemek için hassasiyet düşürüldü
  var DECIDE_RATIO = 1.2;            // Çapraz kaydırmalarda yatayı daha kolay yakala

  function ready(fn) {
    function start() {
      var tries = 0;
      (function wait() {
        if (window.app && typeof window.app.navigate === 'function') return fn();
        if (++tries > 60) return fn(); 
        setTimeout(wait, 50);
      })();
    }
    if (document.readyState === 'complete') setTimeout(start, 0);
    else window.addEventListener('load', start, { once: true });
  }

  function injectStyles() {
    if (document.getElementById('__fluid_tabs_css__')) return;
    var css = [
      // touch-action: pan-y; ile tarayıcıya yatay kaydırmayı bizim yöneteceğimizi, 
      // dikey kaydırmayı ise kendisinin yapmasını söylüyoruz. (Devasa performans artışı)
      '.app-container { overflow: hidden; touch-action: pan-y; }',
      SCREEN_IDS.map(function (id) { return '#' + id; }).join(',') +
        '{ transition: transform ' + DURATION_MS + 'ms ' + EASING + '; will-change: transform; backface-visibility: hidden; transform-style: preserve-3d; }',
      '.app-container.fluid-dragging ' + SCREEN_IDS.map(function (id) { return '#' + id; }).join(', .app-container.fluid-dragging ') +
        '{ transition: none !important; }',
      '.app-container.fluid-mode ' + SCREEN_IDS.map(function (id) { return '#' + id + '.hidden-screen'; }).join(', .app-container.fluid-mode ') +
        '{ opacity: 1; pointer-events: auto; }',
      '.app-container.fluid-mode .fluid-inactive { pointer-events: none; }',
    ].join('\n');
    var style = document.createElement('style');
    style.id = '__fluid_tabs_css__';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // DOM okumasını minimize etmek için
  function getTabScreens() {
    return SCREEN_IDS.map(function (id) { return document.getElementById(id); });
  }

  var activeIndex = 0;
  var dragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragLastX = 0;
  var dragLastT = 0;
  var dragVelocity = 0;
  var horizontalLocked = null; 
  var containerWidth = 0;
  var appContainer = null;
  
  // Performans için değişkenler
  var cachedScreens = [];
  var rafPending = false;

  function setActiveByIndex(idx, animate) {
    idx = Math.max(0, Math.min(TABS.length - 1, idx));
    activeIndex = idx;
    var screens = getTabScreens();
    appContainer.classList.add('fluid-mode');
    
    screens.forEach(function (el, i) {
      if (!el) return;
      el.classList.remove('hidden-screen');
      el.classList.add('active'); 
      if (i === idx) el.classList.remove('fluid-inactive');
      else el.classList.add('fluid-inactive');
      // GPU'yu zorla: translate3d
      el.style.transform = 'translate3d(' + ((i - idx) * 100) + '%, 0, 0)';
    });

    try {
      document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
      var navEl = document.getElementById('nav-' + TABS[idx]);
      if (navEl) navEl.classList.add('active');
    } catch (e) {}

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
      if (i !== activeIndex) el.classList.add('hidden-screen');
    });
  }

  function patchNavigate() {
    var orig = (window.app && window.app.navigate) ? window.app.navigate : null;
    window.app = window.app || {};
    window.app.navigate = function (target) {
      var idx = TABS.indexOf(target);
      if (idx === -1) {
        leaveFluidMode();
        if (typeof orig === 'function') return orig.apply(this, arguments);
        document.querySelectorAll('.app-container > .screen').forEach(function (s) {
          s.classList.add('hidden-screen'); s.classList.remove('active');
        });
        var t = document.getElementById('screen-' + target) || document.getElementById(target);
        if (t) { t.classList.remove('hidden-screen'); t.classList.add('active'); }
        return;
      }
      setActiveByIndex(idx, true);
    };
  }

  function shouldIgnoreTarget(target) {
    if (!target) return false;
    var tag = (target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return true;
    if (target.isContentEditable) return true;
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
    
    // Kaydırma sırasında sürekli DOM aranmasın diye ekranları önbelleğe al
    cachedScreens = getTabScreens();
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
        dragging = false; 
        return;
      }
    }
    
    if (!horizontalLocked) return;
    if (e.cancelable) e.preventDefault();

    // Hız ölçümü
    var now = performance.now();
    var dt = now - dragLastT;
    if (dt > 0) dragVelocity = (x - dragLastX) / dt;
    dragLastX = x;
    dragLastT = now;

    // Tarayıcıyı boğmamak için UI güncellemelerini rAF (requestAnimationFrame) ile kuyruğa al
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function () {
        var atLeft = activeIndex === 0 && dx > 0;
        var atRight = activeIndex === TABS.length - 1 && dx < 0;
        var effectiveDx = (atLeft || atRight) ? dx * DRAG_RUBBER : dx;

        cachedScreens.forEach(function (el, i) {
          if (!el) return;
          var base = (i - activeIndex) * containerWidth;
          // CPU yerine GPU'ya gönder
          el.style.transform = 'translate3d(' + (base + effectiveDx) + 'px, 0, 0)';
        });
        rafPending = false;
      });
    }
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

  function watchNavReady() {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;
    var tryEnable = function () {
      if (nav.dataset.enabled === '1') {
        var current = 0;
        TABS.forEach(function (t, i) {
          var el = document.getElementById('nav-' + t);
          if (el && el.classList.contains('active')) current = i;
        });
        var visibleTab = SCREEN_IDS.findIndex(function (id) {
          var el = document.getElementById(id);
          return el && !el.classList.contains('hidden-screen');
        });
        if (visibleTab !== -1) setActiveByIndex(visibleTab, false);
      }
    };
    var obs = new MutationObserver(tryEnable);
    obs.observe(nav, { attributes: true, attributeFilter: ['data-enabled', 'style'] });
    tryEnable();
  }

  ready(function () {
    appContainer = document.querySelector('.app-container');
    if (!appContainer) return;
    injectStyles();
    patchNavigate();
    bindGestures();
    watchNavReady();
  });
})();