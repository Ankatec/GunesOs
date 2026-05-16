/* ============================================================
   SOHBETO FLUID TABS  v2 — Telegram benzeri akışkan sekme geçişi
   4 ana sekme: sohbetler / kisiler / gruplar / ayarlar
   - Yatay parmak swipe + alt nav tıkla
   - Aktif olmayan sekmeye hafif scale+opacity ("dinamik" his)
   - touch-action + pointer capture + rAF batch ile takılmasız hareket
   Motoru / adapter'ı / engine.js'i kirletmez. SADECE bu dosya.
   YÜKLEME: sohbeto-engine.js'TEN SONRA.
   ============================================================ */
(function () {
  'use strict';

  var TABS = ['sohbetler', 'kisiler', 'gruplar', 'ayarlar'];
  var SCREEN_IDS = TABS.map(function (t) { return 'screen-' + t; });

  // Akışkanlık parametreleri — Telegram benzeri
  var DURATION_MS = 220;              // snap süresi (Telegram ~200-240ms)
  var EASING = 'cubic-bezier(0.33, 1, 0.68, 1)'; // easeOutCubic — doğal yavaşlama
  var SWIPE_DISTANCE_RATIO = 0.30;    // %30 geçince snap (Telegram ~%30) — orta yol
  var SWIPE_VELOCITY = 0.30;          // px/ms — flick eşiği (yumuşak)
  var DRAG_RUBBER = 0.50;             // uçlarda yarı yarıya direnç (zorlanmış değil)
  var TAP_HORIZ_THRESHOLD = 4;        // çok düşük: parmak hareketini hemen yakala
  var DECIDE_RATIO = 1.0;             // |dx| ≥ |dy| → yatay (Telegram'da 1:1)
  var INACTIVE_SCALE = 1.0;           // ölçek değişimi YOK — Telegram gibi düz kayma
  var INACTIVE_OPACITY = 1.0;         // opaklık değişimi YOK — saf yatay kayma

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
    var ids = SCREEN_IDS.map(function (id) { return '#' + id; }).join(',');
    var css = [
      // Konteyner: yatay swipe için browser scroll'unu kapat, dikey kalsın
      '.app-container.fluid-mode{overflow:hidden;touch-action:pan-y;}',
      // 4 ana sekme: yumuşak geçiş + GPU hızlandırma
      ids + '{transition:transform ' + DURATION_MS + 'ms ' + EASING +
            ',opacity ' + DURATION_MS + 'ms ' + EASING + ';' +
            'will-change:transform,opacity;backface-visibility:hidden;}',
      // Drag esnasında transition kapalı (1:1 takip)
      '.app-container.fluid-dragging ' + ids.split(',').join(',.app-container.fluid-dragging ') +
        '{transition:none !important;}',
      // Fluid mode'da tüm tab'lar görünür kalır; konum transform ile yönetilir
      '.app-container.fluid-mode ' + SCREEN_IDS.map(function (id) { return '#' + id + '.hidden-screen'; }).join(',.app-container.fluid-mode ') +
        '{opacity:1;pointer-events:auto;transform:none;}',
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

  // ---------- State ----------
  var activeIndex = 0;
  var dragging = false;
  var pointerId = null;
  var dragStartX = 0, dragStartY = 0;
  var dragLastX = 0, dragLastT = 0, dragVelocity = 0;
  var horizontalLocked = null;   // null=karar verilmedi, true=yatay, false=dikey
  var containerWidth = 0;
  var appContainer = null;
  var rafId = 0;
  var pendingDx = 0;

  // Sekmeleri yerleştir: aktif=0 ofset, diğerleri ±width.
  // dx=0 ise statik snap; aksi halde drag esnasında.
  function paintTransform(dx) {
    var screens = getTabScreens();
    var w = containerWidth || appContainer.clientWidth || window.innerWidth;
    for (var i = 0; i < screens.length; i++) {
      var el = screens[i];
      if (!el) continue;
      var base = (i - activeIndex) * w;
      var x = base + dx;
      // Pasif sekmeye scale + opacity (mesafeye göre yumuşak)
      var dist = Math.min(1, Math.abs(x) / w);
      var scale = 1 - (1 - INACTIVE_SCALE) * dist;
      var opacity = 1 - (1 - INACTIVE_OPACITY) * dist;
      el.style.transform = 'translate3d(' + x + 'px,0,0) scale(' + scale.toFixed(4) + ')';
      el.style.opacity = opacity.toFixed(3);
    }
  }

  function scheduleDraw(dx) {
    pendingDx = dx;
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      paintTransform(pendingDx);
    });
  }

  function setActiveByIndex(idx, animate) {
    idx = Math.max(0, Math.min(TABS.length - 1, idx));
    var changed = idx !== activeIndex;
    activeIndex = idx;
    appContainer.classList.add('fluid-mode');
    var screens = getTabScreens();
    screens.forEach(function (el, i) {
      if (!el) return;
      el.classList.remove('hidden-screen');
      el.classList.add('active');
      if (i === idx) el.classList.remove('fluid-inactive');
      else el.classList.add('fluid-inactive');
    });
    containerWidth = appContainer.clientWidth || window.innerWidth;
    paintTransform(0);

    // Alt nav state
    try {
      document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
      var navEl = document.getElementById('nav-' + TABS[idx]);
      if (navEl) navEl.classList.add('active');
    } catch (e) {}

    if (changed) {
      var name = TABS[idx];
      try {
        if (name === 'kisiler' && typeof window.renderContacts === 'function') window.renderContacts();
        if (name === 'sohbetler' && typeof window.renderConvList === 'function') window.renderConvList();
      } catch (e) {}
    }
  }

  function leaveFluidMode() {
    if (!appContainer) return;
    appContainer.classList.remove('fluid-mode');
    appContainer.classList.remove('fluid-dragging');
    var screens = getTabScreens();
    screens.forEach(function (el, i) {
      if (!el) return;
      el.style.transform = '';
      el.style.opacity = '';
      el.classList.remove('fluid-inactive');
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

  // ---------- Pointer / touch ----------
  function shouldIgnoreTarget(target) {
    if (!target) return false;
    var tag = (target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (target.isContentEditable) return true;
    // Yatay scroll edebilen iç element üstündeysek bırak (örn. story carousel)
    var el = target;
    while (el && el !== appContainer) {
      try {
        var ov = getComputedStyle(el).overflowX;
        if ((ov === 'auto' || ov === 'scroll') && el.scrollWidth > el.clientWidth + 1) return true;
      } catch (e) {}
      el = el.parentElement;
    }
    return false;
  }

  function isFluidMode() {
    return appContainer && appContainer.classList.contains('fluid-mode');
  }

  function getX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
  function getY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

  function onStart(e) {
    if (!isFluidMode()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.touches && e.touches.length > 1) return;
    if (shouldIgnoreTarget(e.target)) return;
    dragStartX = dragLastX = getX(e);
    dragStartY = getY(e);
    dragLastT = performance.now();
    dragVelocity = 0;
    horizontalLocked = null;
    dragging = true;
    pointerId = e.pointerId != null ? e.pointerId : null;
    containerWidth = appContainer.clientWidth || window.innerWidth;
  }

  function onMove(e) {
    if (!dragging) return;
    var x = getX(e), y = getY(e);
    var dx = x - dragStartX, dy = y - dragStartY;

    if (horizontalLocked === null) {
      var ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax < TAP_HORIZ_THRESHOLD && ay < TAP_HORIZ_THRESHOLD) return;
      if (ax > ay * DECIDE_RATIO) {
        horizontalLocked = true;
        appContainer.classList.add('fluid-dragging');
        // Parmak konteyner dışına çıksa bile event'leri burada toplamaya devam et
        if (pointerId != null && appContainer.setPointerCapture) {
          try { appContainer.setPointerCapture(pointerId); } catch (err) {}
        }
      } else {
        horizontalLocked = false;
        dragging = false;
        return;
      }
    }
    if (!horizontalLocked) return;
    if (e.cancelable) e.preventDefault();

    // Kenarlarda elastik direnç
    var atLeft = activeIndex === 0 && dx > 0;
    var atRight = activeIndex === TABS.length - 1 && dx < 0;
    var effectiveDx = (atLeft || atRight) ? dx * DRAG_RUBBER : dx;

    scheduleDraw(effectiveDx);

    // Hız ölçümü
    var now = performance.now();
    var dt = now - dragLastT;
    if (dt > 0) dragVelocity = (x - dragLastX) / dt;
    dragLastX = x;
    dragLastT = now;
  }

  function onEnd(e) {
    if (!dragging) { horizontalLocked = null; return; }
    var wasHoriz = horizontalLocked === true;
    dragging = false;
    horizontalLocked = null;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    appContainer.classList.remove('fluid-dragging');
    if (pointerId != null && appContainer.releasePointerCapture) {
      try { appContainer.releasePointerCapture(pointerId); } catch (err) {}
    }
    pointerId = null;
    if (!wasHoriz) return;

    var dx = dragLastX - dragStartX;
    var absDx = Math.abs(dx);
    var ratio = absDx / (containerWidth || 1);
    var fastFlick = Math.abs(dragVelocity) > SWIPE_VELOCITY && absDx > 10;
    var nextIdx = activeIndex;
    if (ratio > SWIPE_DISTANCE_RATIO || fastFlick) {
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
    // Yeniden boyutlanmada snap'i koru
    window.addEventListener('resize', function () {
      if (!isFluidMode()) return;
      containerWidth = appContainer.clientWidth || window.innerWidth;
      paintTransform(0);
    });
  }

  // Bottom-nav görünür olduğunda fluid mode'u devreye al
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
        else setActiveByIndex(current, false);
      }
    };
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
