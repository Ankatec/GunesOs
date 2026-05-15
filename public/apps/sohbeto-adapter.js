/* ============================================================
   SOHBETO ADAPTER  v1 — Adım 1 (Login + Sohbet Listesi + Chat)
   OO arayüzünü sohbeto-engine.js motoruna bağlar.
   ÖNEMLİ: Bu dosya motor'dan ÖNCE yüklenir.
   ============================================================ */
(function () {
  'use strict';

  // ---------- 1) MOTORUN BEKLEDİĞİ STUB ID'LER ----------
  // Motor yüklenirken bu ID'leri arıyor; OO'da olmayanları görünmez ekleyelim ki patlamasın.
  var STUB_IDS = [
    'btnSendCode','btnLoginSendCode','btnLoginVerify','loginNumber','loginCode','loginCodeWrap',
    'welcomeNumber','welcomeCode','welcomePicCircle','btnStart','otpVerifyBtn','otpResendBtn','otpTimer',
    'btnMenu','menuDropdown','menuSettings','menuEvents','menuLogToggle','menuLogout','eventsModal','eventsBody',
    'settingsModal','settingsName','settingsBio','settingsPicCircle','addContactModal','contactInfoModal',
    'infoAvatar','infoName','infoNumber','infoFieldName','infoFieldNumber','infoFieldStatus',
    'infoFieldConnId','infoFieldConnType','newContactNumber','newContactError','contactList','contactCount',
    'navBadgeSohbet','convListGenel','convListOzel','convOzelBadge','pageConvList','pageChat','screenChat',
    'topbarTitle','topbarStatus','topbarBack','topbarAvatar','topbarVideoCall','topbarAudioCall',
    'btnAddContact','btnSend','btnMic','btnMute','btnSpeaker','btnVideoMute','btnVideoSpeaker',
    'btnCameraToggle','btnVideoToggle','swipeContainer','viewSohbetler','viewKisiler','viewGruplar',
    'callScreen','callAvatar','callName','callStatus','activeCallScreen','activeCallAvatar',
    'activeCallName','activeCallStatus','activeCallDuration','videoCallName','videoCallDuration',
    'videoLocal','videoRemote','videoContainer','audioContainer','fileInput',
    'logContainer','logPanel','topNotif','notifText','notifTime','memoriesList','storiesRow',
    'screenWelcome','screenLogin','screenOtp','loginPicCircle','alphaBar','themePicker',
    'avatarGrid','avatarPicker','lockLength','lockOutput','themeTour','ltTitle',
    'cardAvatar','cardName','cardNumber','cardMoreMenu'
  ];

  function tagFor(id) {
    if (id === 'fileInput') return 'input';
    if (/^(btn|otp.+Btn|topbar(Back|Audio|Video))/.test(id)) return 'button';
    if (/^(login(Number|Code)|welcome(Number|Code)|new[A-Z]|infoField|settings(Name|Bio)|lockLength)$/.test(id)) return 'input';
    return 'div';
  }

  function buildStubs() {
    if (document.getElementById('__engine_stub_host__')) return;
    var host = document.createElement('div');
    host.id = '__engine_stub_host__';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;visibility:hidden;pointer-events:none;';
    STUB_IDS.forEach(function (id) {
      if (document.getElementById(id)) return; // OO'da zaten varsa dokunma
      var el = document.createElement(tagFor(id));
      el.id = id;
      if (el.tagName === 'INPUT') { el.type = (id === 'fileInput' ? 'file' : 'text'); }
      // Bazı motor kodları .classList.add('hidden') yapıyor; sınıf hazır olsun
      el.className = 'hidden';
      host.appendChild(el);
    });
    (document.body || document.documentElement).appendChild(host);
  }

  // DOM hazır olmadan motor yüklenirse stub'lar olmaz → DOMContentLoaded öncesi de garanti et
  if (document.body) buildStubs();
  else document.addEventListener('DOMContentLoaded', buildStubs, { once: true });

  // ---------- 2) GLOBAL KÖPRÜ — motor yüklendikten sonra çalışacak ----------
  function ready(fn) {
    if (document.readyState === 'complete') setTimeout(fn, 0);
    else window.addEventListener('load', fn, { once: true });
  }

  // OO'nun ekran navigasyonu (mevcut OO mantığı; tek kaynak burada)
  // Hangi ekranlarda alt nav gizlenecek (tam ekran katmanlar)
  var FULLSCREEN_OVERLAYS = {
    'screen-chat': true,
    'screen-ooCall': true,
    'screen-ooIncoming': true,
    'screen-ayarlar': true,
    'screen-phone': true,
    'screen-auth': true
  };
  function applyNavVisibility(screenId) {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;
    // Sadece login sonrası enterMain çağrılınca nav görünür hale gelir;
    // burada style.display zaten 'none' ise dokunmuyoruz (kayıt öncesi gizli kalsın).
    if (nav.dataset.enabled !== '1') return;
    if (FULLSCREEN_OVERLAYS[screenId]) nav.style.display = 'none';
    else nav.style.display = '';
  }
  function showScreen(screenId) {
    var screens = document.querySelectorAll('.app-container > .screen');
    screens.forEach(function (s) {
      s.classList.add('hidden-screen');
      s.classList.remove('active');
    });
    var target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden-screen');
      target.classList.add('active');
    }
    applyNavVisibility(screenId);
  }

  ready(function () {
    function getEngineState() {
      try { if (typeof state !== 'undefined' && state) return state; } catch (e) {}
      return window.state || null;
    }
    function normalizePhoneForAdapter(n) {
      try { if (typeof normalizeNumber === 'function') return normalizeNumber(n); } catch (e) {}
      var s = String(n || '').trim().replace(/[\s\-()]/g, '');
      if (!s) return '';
      s = s.replace(/^00/, '+').replace(/[^+\d]/g, '');
      var digits = s.replace(/^\+/, '');
      if (digits.charAt(0) === '0' && digits.length === 11) digits = '90' + digits.substring(1);
      else if (digits.length === 10 && digits.charAt(0) === '5') digits = '90' + digits;
      else if (digits.indexOf('0090') === 0) digits = digits.substring(2);
      return digits ? ('+' + digits) : '';
    }

    // Motor global mı diye bak
    var hasEngine = !!(getEngineState() && typeof window.openChat === 'function');
    if (!hasEngine) {
      console.warn('[adapter] sohbeto-engine.js yüklenmemiş gibi görünüyor.');
    }

    // ---------- 2A) APP NESNESİ (OO HTML'inin çağırdığı isim) ----------
    window.app = window.app || {};

    window.app.navigate = function (target) {
      var map = {
        phone: 'screen-phone',
        auth: 'screen-auth',
        sohbetler: 'screen-sohbetler',
        kisiler: 'screen-kisiler',
        gruplar: 'screen-gruplar',
        ayarlar: 'screen-ayarlar',
        chat: 'screen-chat'
      };
      showScreen(map[target] || target);
      try {
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        var navEl = document.getElementById('nav-' + target);
        if (navEl) navEl.classList.add('active');
      } catch (e) {}
      if (target === 'kisiler' && typeof window.renderContacts === 'function') {
        window.renderContacts();
      }
    };

    // İlk kez mi giriş yoksa daha önce kayıt olmuş mu? IndexedDB'de firstSessionDone'a bakar.
    // Akışı belirler: WELCOME (ilk kayıt) vs LOGIN (tekrar giriş).
    var _flow = null; // 'welcome' | 'login'
    async function detectFlow() {
      if (_flow) return _flow;
      try {
        if (typeof window.loadIdentity === 'function') {
          var ident = await window.loadIdentity();
          _flow = ident && ident.firstDone ? 'login' : 'welcome';
        } else {
          _flow = 'welcome';
        }
      } catch (e) { _flow = 'welcome'; }
      return _flow;
    }

    window.app.sendCode = async function (resend) {
      var phone = (document.getElementById('phoneInput') || {}).value || '';
      phone = phone.trim();
      if (!phone) { alert('Lütfen telefon numaranızı girin.'); return; }
      var flow = await detectFlow();
      // OTP etiketini güncelle
      var lbl = document.getElementById('authPhoneLabel'); if (lbl) lbl.innerText = phone;
      if (flow === 'login') {
        var ln = document.getElementById('loginNumber'); if (ln) ln.value = phone;
        var btnL = document.getElementById('btnLoginSendCode');
        if (btnL && typeof btnL.click === 'function') btnL.click();
      } else {
        var wn = document.getElementById('welcomeNumber'); if (wn) wn.value = phone;
        var btnW = document.getElementById('btnSendCode');
        if (btnW && typeof btnW.click === 'function') btnW.click();
      }
      // Motor postMessage'ı parent'a yolladı → kod Mesajlar app'ine düştü.
      if (!resend) showScreen('screen-auth');
    };

    window.app.verifyCode = async function () {
      var inputs = document.querySelectorAll('#codeInputs .code-input');
      var code = '';
      inputs.forEach(function (i) { code += (i.value || '').trim(); });
      if (code.length !== 6) { alert('6 haneli kodu eksiksiz girin.'); return; }
      var flow = _flow || (await detectFlow());
      if (flow === 'login') {
        var lc = document.getElementById('loginCode'); if (lc) lc.value = code;
        var b = document.getElementById('btnLoginVerify');
        if (b && typeof b.click === 'function') b.click();
      } else {
        var wc = document.getElementById('welcomeCode'); if (wc) wc.value = code;
        var bs = document.getElementById('btnStart');
        if (bs && typeof bs.click === 'function') bs.click();
      }
    };

    // ---------- 2B) OTP INPUT OTOMATİK ATLAMA (görsel davranış) ----------
    var codeInputs = document.querySelectorAll('#codeInputs .code-input');
    codeInputs.forEach(function (inp, idx) {
      inp.addEventListener('input', function () {
        if (inp.value && idx < codeInputs.length - 1) codeInputs[idx + 1].focus();
        // 6 hane tamamsa otomatik doğrula
        var all = ''; codeInputs.forEach(function (x) { all += (x.value || ''); });
        if (all.length === 6) window.app.verifyCode();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && idx > 0) codeInputs[idx - 1].focus();
      });
    });

    // ---------- 2C) Login BAŞARILI olduğunda ana ekrana geç ----------
    // Motor başarılı doğrulamadan sonra loginCodeWrap'a 'hidden' ekliyor (engine sat. ~1879).
    // Ama bu hep ekleniyor olabilir; daha güvenli sinyal: state.nick set olur ve WS bağlanır.
    // En basit ve sağlam: motorun renderConvList ilk çağırıldığında ana ekrana geç.
    var enteredMain = false;
    function enterMain() {
      if (enteredMain) return;
      enteredMain = true;
      // Alt nav'ı sadece giriş sonrası etkinleştir; sonrası ekran bazlı yönetilir.
      var nav = document.getElementById('bottom-nav');
      if (nav) { nav.dataset.enabled = '1'; nav.style.display = ''; }
      showScreen('screen-sohbetler');
    }

    // ---------- 2D) renderConvList monkey-patch → OO listesine yaz ----------
    var origRender = window.renderConvList;
    window.renderConvList = function () {
      // Önce motoru çalıştır (stub convListOzel'e yazar)
      try { if (typeof origRender === 'function') origRender.apply(this, arguments); } catch (e) { console.error(e); }
      // OO'nun sohbetler ekranındaki content-area'sını bul
      var oo = document.querySelector('#screen-sohbetler .content-area');
      var src = document.getElementById('convListOzel');
      if (!oo || !src) return;
      // İçeriği klonla
      oo.innerHTML = '';
      Array.from(src.children).forEach(function (child) {
        var clone = child.cloneNode(true);
        // tıklama handler'ı klonla taşınmaz → connId'yi data-attr olarak yakalayıp yeniden bağla
        // Motor d.onclick = () => openChat(connId) yazıyordu; connId'yi avatar'dan/isimden çıkaramıyoruz
        // Bu nedenle adapter, motorun listesine bir overlay click delegasyonu kuracak (aşağıda)
        oo.appendChild(clone);
      });
      // Stub gözükmesin diye absolute gizli zaten
      enterMain();
    };

    // OO listesine click delegasyonu — motorun stub listesindeki .conv-item index'ine göre tetikle
    document.addEventListener('click', function (ev) {
      var item = ev.target.closest('#screen-sohbetler .content-area .conv-item');
      if (!item) return;
      var oo = document.querySelector('#screen-sohbetler .content-area');
      var idx = Array.prototype.indexOf.call(oo.children, item);
      var src = document.getElementById('convListOzel');
      if (!src || !src.children[idx]) return;
      // Stub'taki gerçek motor item'ına click forward
      src.children[idx].click();
    });

    // ---------- 2E) openChat monkey-patch → OO chat ekranını göster + başlık/avatar ----------
    var origOpenChat = window.openChat;
    window.openChat = async function (id) {
      try { if (typeof origOpenChat === 'function') await origOpenChat.apply(this, arguments); } catch (e) { console.error(e); }
      // OO chat ekranını aç
      showScreen('screen-chat');
      // OO başlık/avatar
      var nameEl = document.getElementById('chatHName');
      var avEl = document.getElementById('chatHAvatar');
      if (nameEl) {
        var t = document.getElementById('topbarTitle');
        nameEl.innerText = t ? (t.innerText || '—') : '—';
      }
      if (avEl) {
        // Motorun çizdiği avatarı (topbarAvatar) klonla
        var src = document.getElementById('topbarAvatar');
        if (src) {
          avEl.innerHTML = src.innerHTML;
          avEl.className = 'chat-h-avatar ' + (src.className.replace(/\btopbar-avatar\b|\bhidden\b/g, '').trim());
        }
      }
      // Mesaj kutusunu hazırla: temizle, ikonu güncelle, odaklan
      var ci = document.getElementById('chatInput');
      if (ci) { ci.value = ''; try { ci.focus({ preventScroll: true }); } catch (e) { ci.focus(); } }
      try { window.updateSendIcon && window.updateSendIcon(); } catch (e) {}
    };

    // ---------- 2F) OO chat aksiyonları ----------
    window.closeChat = function () {
      var st = getEngineState();
      if (st) { st.chatMode = 'list'; st.activeChat = null; }
      var ac = document.querySelector('.app-container');
      if (ac) { ac.classList.remove('chat-mode'); ac.classList.add('list-mode'); }
      showScreen('screen-sohbetler');
    };

    window.sendChatMsg = function () {
      var inp = document.getElementById('chatInput');
      if (!inp || !inp.value.trim()) return;
      // Motorun gerçek gönderim fonksiyonu (özel sohbette ZORUNLU P2P, WSS yalnız tanıştırma)
      if (typeof window.sendCurrentMessage === 'function') {
        window.sendCurrentMessage();
      } else {
        // Fallback: Enter tuşu simülasyonu
        var ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        inp.dispatchEvent(ev);
      }
      // Gönderim sonrası ikonu mikrofona döndür ve odağı koru
      try { window.updateSendIcon && window.updateSendIcon(); } catch (e) {}
      try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); }
    };

    window.onSendBtn = function () { window.sendChatMsg(); };

    window.updateSendIcon = function () {
      var inp = document.getElementById('chatInput');
      var btn = document.getElementById('chatSendBtn');
      if (!inp || !btn) return;
      if (inp.value.trim()) { btn.classList.remove('is-mic'); btn.classList.add('is-send'); }
      else { btn.classList.add('is-mic'); btn.classList.remove('is-send'); }
    };

    // Chat üst barı (Adım 4): ses/görüntülü arama bağlandı
    window.chatCall    = window.chatCall    || function () { startCallForActiveChat('audio'); };
    window.chatVideo   = window.chatVideo   || function () { startCallForActiveChat('video'); };
    window.chatMore    = window.chatMore    || function () { console.info('[adapter] chatMore'); };
    window.chatNext    = window.chatNext    || function () { console.info('[adapter] chatNext'); };
    window.chatAttach  = window.chatAttach  || function () { console.info('[adapter] chatAttach'); };
    window.chatCamera  = window.chatCamera  || function () { console.info('[adapter] chatCamera'); };
    // ---------- KİŞİLER (Adım 2) ----------
    window.openAddContact = function () {
      var s = document.getElementById('addContactSheet');
      if (s) { s.classList.remove('hidden-screen'); s.classList.add('active'); }
      var n = document.getElementById('newContactName'); if (n) n.value = '';
      var p = document.getElementById('newContactPhone'); if (p) p.value = '';
      // Motorun stub error'ını da temizle
      var err = document.getElementById('newContactError'); if (err) { err.innerText = ''; err.classList.add('hidden'); }
      // Motorun bazı yerleri addContactModal'ı görünür sayıyor; senkron tut
      var m = document.getElementById('addContactModal'); if (m) m.classList.remove('hidden');
      setTimeout(function () { if (n) n.focus(); }, 50);
    };

    window.closeAddContact = function () {
      var s = document.getElementById('addContactSheet');
      if (s) { s.classList.add('hidden-screen'); s.classList.remove('active'); }
      var m = document.getElementById('addContactModal'); if (m) m.classList.add('hidden');
    };

    // OO sheet'inden Kaydet → motorun kendi saveNewContact akışına bağla.
    // Not: engine.js içindeki contactsState "const" olduğu için window üzerinden okunamaz.
    // Bu yüzden veriyi motor fonksiyonları ve motorun gizli #contactList çıktısı üzerinden taşırız.
    var _origUpdateContactList = typeof window.updateContactList === 'function' ? window.updateContactList : null;

    window.saveContact = async function () {
      var nameEl = document.getElementById('newContactName');
      var phoneEl = document.getElementById('newContactPhone');
      var numberStub = document.getElementById('newContactNumber');
      var errEl = document.getElementById('newContactError');

      var name = (nameEl && nameEl.value || '').trim();
      var phoneRaw = (phoneEl && phoneEl.value || '').trim();

      if (!name)     { alert('Lütfen ad soyad girin.'); nameEl && nameEl.focus(); return; }
      if (!phoneRaw) { alert('Lütfen telefon numarası girin.'); phoneEl && phoneEl.focus(); return; }

      if (numberStub) numberStub.value = phoneRaw;
      if (errEl) { errEl.innerText = ''; errEl.classList.add('hidden'); }

      if (typeof window.saveNewContact !== 'function') {
        alert('Motor bağlantısı henüz kurulmadı. Lütfen birkaç saniye sonra tekrar deneyin.');
        return;
      }

      try {
        await window.saveNewContact();
      } catch (e) {
        console.error('[adapter] saveContact hata:', e);
        alert('Kişi eklenemedi: ' + (e && e.message ? e.message : e));
        return;
      }

      if (errEl && !errEl.classList.contains('hidden') && errEl.innerText.trim()) {
        alert(errEl.innerText.trim());
        return;
      }

      window.closeAddContact();
      if (nameEl) nameEl.value = '';
      if (phoneEl) phoneEl.value = '';
      window.renderContacts();
    };

    // Motorun #contactList stub'ından OO'nun #contactsList'ine yansıt
    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function getInitials(name, number) {
      var src = (name || number || '?').trim();
      var parts = src.split(/\s+/).filter(Boolean);
      var letters = parts.length >= 2
        ? (parts[0][0] + parts[1][0])
        : (src.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/g, '').slice(0, 2) || '?');
      return letters.toUpperCase();
    }

    function renderContactsFromEngineDom() {
      var listEl = document.getElementById('contactsList');
      var emptyEl = document.getElementById('contactsEmpty');
      if (!listEl) return;

      var src = document.getElementById('contactList');
      var engineItems = src ? Array.from(src.querySelectorAll('.contact-item')) : [];
      var srcText = src ? (src.textContent || '').trim() : '';

      if (!engineItems.length) {
        listEl.innerHTML = '';
        if (srcText && srcText.indexOf('Sonuç bulunamadı') !== -1) {
          if (emptyEl) emptyEl.style.display = 'none';
          listEl.innerHTML = '<div style="padding:40px 8px;text-align:center;color:var(--text-secondary);font-size:.9rem">Sonuç bulunamadı</div>';
        } else {
          if (emptyEl) emptyEl.style.display = '';
        }
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';

      // contactsState motorda script-scope `const` olarak yaşıyor; aynı sayfada
      // başka bir <script>'ten erişilebilir. Yine de her ihtimale karşı try/catch.
      var stateValues = [];
      try {
        if (typeof contactsState !== 'undefined' && contactsState && contactsState.byNumber) {
          stateValues = Array.from(contactsState.byNumber.values());
        }
      } catch (e) { stateValues = []; }

      listEl.innerHTML = engineItems.map(function (item, idx) {
        var name = (item.querySelector('.contact-name') || {}).textContent || '—';
        var status = (item.querySelector('.contact-status') || {}).textContent || '';
        var avatarHtml = (item.querySelector('.contact-avatar') || {}).innerHTML || escapeHtml(getInitials(name, ''));
        // Aynı isimle eşleşeni bulmaya çalış; bulunamazsa boş bırak (Adım 4'te
        // ccOpenChat connId üzerinden de gidebilecek, şimdilik number yeterli).
        var match = stateValues.find(function (c) { return (c.name || '') === name; });
        var number = match ? (match.number || '') : '';
        var connId = match && match.connId ? match.connId : '';
        return '<div class="contact-row" data-engine-index="' + idx + '"'
          +   ' data-name="' + escapeHtml(name) + '"'
          +   ' data-number="' + escapeHtml(number) + '"'
          +   ' data-connid="' + escapeHtml(connId) + '">'
          +   '<div class="contact-avatar" data-avatar="1" style="background:linear-gradient(135deg,#34b7f1,#128c7e);color:#fff;font-weight:600;display:flex;align-items:center;justify-content:center;font-size:.95rem;overflow:hidden">'
          +     avatarHtml
          +   '</div>'
          +   '<div style="flex:1;min-width:0;margin-left:12px">'
          +     '<div style="font-weight:600;font-size:.98rem;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(name) + '</div>'
          +     '<div style="font-size:.82rem;color:var(--text-secondary);margin-top:2px">' + escapeHtml(status) + '</div>'
          +   '</div>'
          + '</div>';
      }).join('');
    }

    window.renderContacts = function () {
      try {
        var search = document.getElementById('contactSearch');
        var filter = search ? (search.value || '').trim() : '';
        if (typeof _origUpdateContactList === 'function') _origUpdateContactList(filter);
      } catch (e) { console.error('[adapter] updateContactList hata:', e); }
      renderContactsFromEngineDom();
    };

    // Arama input'u zaten oninput="renderContacts()" çağırıyor — ek listener'a gerek yok.

    // ---------- Kişi satırı tıklaması → OO Kişi Kartı (overlay) ----------
    // ÖNEMLİ: Artık motorun .contact-item click'ine forward etmiyoruz.
    // OO'nun #contactCardOverlay'ini açıp veriyi DOM'dan dolduruyoruz.
    // Sohbet başlatma (ccOpenChat) Adım 4'te bağlanacak.
    var _activeCard = { name: '', number: '', connId: '', engineIndex: -1 };

    function openContactCard(row, ev) {
      var overlay = document.getElementById('contactCardOverlay');
      if (!overlay) return;
      var name   = row.getAttribute('data-name')   || '';
      var number = row.getAttribute('data-number') || '';
      var connId = row.getAttribute('data-connid') || '';
      var idx    = Number(row.getAttribute('data-engine-index'));
      _activeCard = { name: name, number: number, connId: connId, engineIndex: idx };

      // Avatar — önce satırdaki avatar (resim/başharf) içeriği, yoksa initials
      var avEl = document.getElementById('ccAvatar');
      if (avEl) {
        var rowAv = row.querySelector('[data-avatar="1"]');
        var inner = rowAv ? rowAv.innerHTML.trim() : '';
        avEl.innerHTML = inner || escapeHtml(getInitials(name, number));
      }
      var nmEl = document.getElementById('ccName');
      if (nmEl) nmEl.textContent = name || '—';
      var phEl = document.getElementById('ccPhone');
      if (phEl) phEl.textContent = number || '—';

      // Tıklanan noktadan açılma origin'i (animasyon için)
      try {
        var rect = row.getBoundingClientRect();
        var orect = overlay.getBoundingClientRect();
        var px = (ev && ev.clientX) ? ev.clientX : (rect.left + rect.width / 2);
        var py = (ev && ev.clientY) ? ev.clientY : (rect.top  + rect.height / 2);
        overlay.style.setProperty('--tx', (px - orect.left) + 'px');
        overlay.style.setProperty('--ty', (py - orect.top)  + 'px');
      } catch (e) {}

      overlay.classList.remove('closing');
      overlay.classList.add('open');
    }

    document.addEventListener('click', function (ev) {
      var row = ev.target.closest && ev.target.closest('#contactsList .contact-row');
      if (!row) return;
      ev.preventDefault();
      ev.stopPropagation();
      openContactCard(row, ev);
    });

    // Motor saveNewContact sonrası updateContactList çağırıyor → OO listesini de aynı anda tazele
    if (typeof _origUpdateContactList === 'function') {
      window.updateContactList = function () {
        try { _origUpdateContactList.apply(this, arguments); } catch (e) { console.error(e); }
        try { renderContactsFromEngineDom(); } catch (e) { console.error(e); }
      };
    }

    // ---------- Kişi Kartı: animasyonlu kapatma + buton stub'ları ----------
    window.closeContactCard = function (ev) {
      // Karta tıklandıysa kapatma (OO'da overlay backdrop tıklamasında çağrılıyor)
      if (ev && ev.target && ev.target.id !== 'contactCardOverlay') return;
      var o = document.getElementById('contactCardOverlay');
      if (!o || !o.classList.contains('open')) return;
      o.classList.remove('open');
      o.classList.add('closing');
      var card = o.querySelector('.contact-card');
      var done = function () {
        o.classList.remove('closing');
        if (card) card.removeEventListener('transitionend', done);
      };
      if (card) card.addEventListener('transitionend', done, { once: true });
      // Güvenlik: transitionend tetiklenmezse ~500ms sonra temizle
      setTimeout(done, 500);
    };

    // ---------- KİŞİ KARTI BUTONLARI (Adım 4) ----------
    // Her cc* aksiyonunda _activeCard'ı contactsState'ten "tazele" — DB'deki
    // eski connId yerine canlı state.users'taki connId'ye baksın.
    function refreshedCard() {
      var c = Object.assign({}, _activeCard || {});
      try {
        if (typeof contactsState !== 'undefined' && contactsState.byNumber) {
          var rec = null;
          if (c.number) rec = contactsState.byNumber.get(c.number);
          if (!rec && c.name) {
            contactsState.byNumber.forEach(function (r) { if (!rec && (r.name || '') === c.name) rec = r; });
          }
          if (rec) {
            c.number = rec.number || c.number;
            // DB connId varsa al, ama canlı users haritasında yoksa görmezden gel
            var dbConn = rec.connId || '';
            var liveState = getEngineState();
            if (dbConn && liveState && liveState.users && liveState.users.has(dbConn)) {
              c.connId = dbConn;
            } else if (dbConn && (!c.connId || c.connId === dbConn)) {
              // canlı değilse temizle ki LOOKUP yoluna düşsün
              c.connId = '';
            }
          }
        }
      } catch (e) {}
      return c;
    }

    window.ccCall  = function () { var c = refreshedCard(); closeCardThen(function(){ startCallFromCard(c, 'audio'); }); };
    window.ccVideo = function () { var c = refreshedCard(); closeCardThen(function(){ startCallFromCard(c, 'video'); }); };
    window.ccInfo  = function () { console.info('[adapter] ccInfo  — Adım 6 (bilgi paneli)'); };

    window.ccOpenChat = function () {
      var c = refreshedCard();
      console.info('[adapter] ccOpenChat →', c);
      closeCardThen(function () {
        // 1) Canlı connId varsa direkt openChat
        var liveState = getEngineState();
        if (c.connId && liveState && liveState.users && liveState.users.has(c.connId)
            && typeof window.openChat === 'function') {
          try { window.openChat(c.connId); } catch (e) { console.error('[adapter] openChat hata:', e); }
          return;
        }
        // 2) Number varsa motorun openContactByNumber'ı (LOOKUP atar, online ise otomatik openChat)
        if (c.number && typeof window.openContactByNumber === 'function') {
          try { window.openContactByNumber(c.number); } catch (e) { console.error('[adapter] openContactByNumber hata:', e); }
          return;
        }
        // 3) Numara da yok → kullanıcıya açıklayıcı uyarı
        alert('Bu kişi için sohbet açılamadı. Lütfen kişiyi telefon numarasıyla yeniden ekleyin.');
      });
    };

    function closeCardThen(fn) {
      window.closeContactCard({ target: { id: 'contactCardOverlay' } });
      // animasyonun bitmesini bekle (CSS .42s)
      setTimeout(fn, 260);
    }

    // ---------- ARAMA — kart veya chat üst barından başlat ----------
    function isLiveConnId(id) {
      try { var st = getEngineState(); return !!(id && st && st.users && st.users.has(id)); }
      catch (e) { return false; }
    }

    // Motor state.users değerini "Ad [number]" formatında tutar; numaradan canlı connId bul.
    function findLiveConnIdByNumber(number) {
      var st = getEngineState();
      if (!number || !st || !st.users) return null;
      var normalized = normalizePhoneForAdapter(number);
      var needle = '[' + normalized + ']';
      var found = null;
      try {
        st.users.forEach(function (label, connId) {
          var labelNumber = normalizePhoneForAdapter(String(label || '').match(/\[(.*?)\]/)?.[1] || '');
          if (!found && labelNumber && labelNumber === normalized) found = connId;
          else if (!found && typeof label === 'string' && label.indexOf(needle) !== -1) found = connId;
        });
      } catch (e) {}
      return found;
    }

    // LOOKUP atıp en fazla `timeoutMs` boyunca canlı connId'yi bekle
    function lookupAndWait(number, timeoutMs) {
      return new Promise(function (resolve) {
        if (!number) return resolve(null);
        var live = findLiveConnIdByNumber(number);
        if (live) return resolve(live);
        try {
          if (typeof window.wsSend === 'function') window.wsSend('LOOKUP###' + number, 'HERKES');
        } catch (e) {}
        var elapsed = 0, step = 200;
        var t = setInterval(function () {
          var id = findLiveConnIdByNumber(number);
          elapsed += step;
          if (id) { clearInterval(t); resolve(id); }
          else if (elapsed >= (timeoutMs || 3000)) { clearInterval(t); resolve(null); }
        }, step);
      });
    }

    async function startCallFromCard(c, kind) {
      // 1) Mevcut connId canlı mı?
      var connId = isLiveConnId(c.connId) ? c.connId : null;
      // 2) Değilse, numaradan state.users içinde tara
      if (!connId) connId = findLiveConnIdByNumber(c.number);
      // 3) Yine yoksa LOOKUP at ve cevabı bekle
      if (!connId && c.number) {
        // Kullanıcıya bekleme görünür olsun: arama ekranını "Aranıyor..." ile aç
        openOOCallScreen(c, kind);
        var st = document.getElementById('oocStatus'); if (st) st.textContent = 'Bağlanılıyor…';
        connId = await lookupAndWait(c.number, 3500);
        if (!connId) {
          closeOOCallScreen();
          enqueueOfflineCall(c, kind);
          showCallToast('📵 ' + (c.name || c.number || 'Kişi') + ' çevrimdışı. Çevrimiçi olduğunda otomatik haber vereceğiz.');
          return;
        }
      }
      if (!connId) { alert('Aranacak kişi bulunamadı.'); return; }

      // Arama ekranı zaten açık değilse aç
      var scr = document.getElementById('screen-ooCall');
      if (!scr || scr.classList.contains('hidden-screen')) openOOCallScreen(c, kind);
      var st2 = document.getElementById('oocStatus'); if (st2) st2.textContent = 'Çalıyor…';
      // Caller: yerel ringback başlat, mikrofon trafiğini accept'e kadar sustur
      startRingbackTone();
      muteOutgoingTracksUntilAccepted(connId);

      try {
        if (kind === 'video' && typeof window.startVideoCall === 'function') window.startVideoCall(connId, false);
        else if (typeof window.startAudioCall === 'function') window.startAudioCall(connId, false);
      } catch (e) { console.error('[adapter] arama başlatılamadı:', e); }
    }

    function startCallForActiveChat(kind) {
      var st = getEngineState() || {};
      if (!st.activeChat || st.activeChat === 'genel') { alert('Önce bir kişi sohbeti açın.'); return; }
      var connId = st.activeChat;
      // Kişi adını topbar'dan al
      var name = (document.getElementById('chatHName') || {}).textContent || '';
      // contactsState üzerinden number bul
      var number = '';
      try {
        if (typeof contactsState !== 'undefined' && contactsState.byNumber) {
          contactsState.byNumber.forEach(function (rec) { if (rec.connId === connId) number = rec.number; });
        }
      } catch (e) {}
      var c = { name: name, number: number, connId: connId, engineIndex: -1 };
      openOOCallScreen(c, kind);
      try {
        if (kind === 'video' && typeof window.startVideoCall === 'function') window.startVideoCall(connId, false);
        else if (typeof window.startAudioCall === 'function') window.startAudioCall(connId, false);
      } catch (e) { console.error('[adapter] arama başlatılamadı:', e); }
    }

    function showNotif(msg) {
      try { if (typeof window.showNotif === 'function') return; } catch (e) {}
      console.info('[adapter notif]', msg);
    }

    // ---------- OO Arama Ekranı ----------
    var ooCallTimer = null;
    var ooCallStartedAt = 0;
    var ooIncomingTimer = null;
    var ooIncomingStartedAt = 0;
    var ooAcceptedIncomingStartedAt = 0;
    var ooEngineActiveSeen = false;
    var ooOutgoingPending = false; // caller "Çalıyor…" bekliyor (timer durur)
    var ooOutgoingConnId = null;

    // ====== Ringback Tone (caller tarafı) — WebAudio ile sentezleme ======
    var ringbackCtx = null, ringbackOsc = null, ringbackGain = null, ringbackTimer = null;
    function startRingbackTone() {
      try {
        stopRingbackTone();
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ringbackCtx = new AC();
        var ctx = ringbackCtx;
        // Avrupa ringback: 425Hz, 1s on / 4s off (kısaltılmış 1s on / 2s off)
        var play = function () {
          if (!ringbackCtx) return;
          var osc = ctx.createOscillator(); var g = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = 440;
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
          g.gain.setValueAtTime(0.18, ctx.currentTime + 0.95);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 1.05);
          ringbackOsc = osc; ringbackGain = g;
        };
        play();
        ringbackTimer = setInterval(play, 3000);
      } catch (e) { /* sessizce yut */ }
    }
    function stopRingbackTone() {
      try { if (ringbackTimer) clearInterval(ringbackTimer); } catch (e) {}
      ringbackTimer = null;
      try { if (ringbackOsc) ringbackOsc.stop(); } catch (e) {}
      try { if (ringbackCtx) ringbackCtx.close(); } catch (e) {}
      ringbackCtx = null; ringbackOsc = null; ringbackGain = null;
    }

    // ====== Outgoing track mute (accept'e kadar mikrofon kapalı) ======
    var outgoingMutePoll = null;
    function muteOutgoingTracksUntilAccepted(connId) {
      if (outgoingMutePoll) clearInterval(outgoingMutePoll);
      ooOutgoingPending = true;
      ooOutgoingConnId = connId;
      var elapsed = 0;
      outgoingMutePoll = setInterval(function () {
        elapsed += 200;
        try {
          // Engine'in localAudioStream/localVideoStream globalleri (let → script-scope)
          var s = (typeof localAudioStream !== 'undefined') ? localAudioStream : null;
          if (s && s.getAudioTracks) s.getAudioTracks().forEach(function (t) { t.enabled = false; });
          var v = (typeof localVideoStream !== 'undefined') ? localVideoStream : null;
          if (v && v.getAudioTracks) v.getAudioTracks().forEach(function (t) { t.enabled = false; });
          // PC sender'larını da sustur (yedek)
          var p = (typeof peers !== 'undefined') ? peers : null;
          if (p && connId && p[connId] && p[connId].pc) {
            p[connId].pc.getSenders().forEach(function (s2) {
              if (s2.track && s2.track.kind === 'audio') s2.track.enabled = false;
            });
          }
        } catch (e) {}
        // Status değişti mi? (Bağlandı → mikrofonu aç)
        var stEl = document.getElementById('activeCallStatus');
        var st = stEl ? (stEl.innerText || '').trim() : '';
        if (st === 'Bağlandı' || elapsed > 60000) {
          clearInterval(outgoingMutePoll); outgoingMutePoll = null;
          ooOutgoingPending = false;
          // mute butonuna saygı duyarak mikrofonu aç
          var muteBtn = document.getElementById('oocMute');
          var userWantsMute = !!(muteBtn && muteBtn.classList.contains('active'));
          try {
            var s = (typeof localAudioStream !== 'undefined') ? localAudioStream : null;
            if (s && s.getAudioTracks) s.getAudioTracks().forEach(function (t) { t.enabled = !userWantsMute; });
            var v = (typeof localVideoStream !== 'undefined') ? localVideoStream : null;
            if (v && v.getAudioTracks) v.getAudioTracks().forEach(function (t) { t.enabled = !userWantsMute; });
          } catch (e) {}
        }
      }, 200);
    }
    function clearOutgoingMute() {
      if (outgoingMutePoll) { clearInterval(outgoingMutePoll); outgoingMutePoll = null; }
      ooOutgoingPending = false; ooOutgoingConnId = null;
    }

    // ====== Offline call queue (callee açık değilken) ======
    var OFFLINE_CALL_KEY = 'oo_offline_call_queue_v1__' + (window.__SOHBETO_TAB_ID__ || 'shared');
    function loadOfflineCallQueue() {
      try { return JSON.parse(localStorage.getItem(OFFLINE_CALL_KEY) || '[]'); } catch (e) { return []; }
    }
    function saveOfflineCallQueue(q) {
      try { localStorage.setItem(OFFLINE_CALL_KEY, JSON.stringify(q)); } catch (e) {}
    }
    function enqueueOfflineCall(c, kind) {
      var q = loadOfflineCallQueue();
      q.push({ name: c.name || '', number: c.number || '', kind: kind, ts: Date.now() });
      saveOfflineCallQueue(q);
    }
    function showCallToast(msg) {
      var t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);background:rgba(20,24,33,.95);color:#fff;padding:12px 18px;border-radius:14px;font:500 14px system-ui,sans-serif;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:80%;text-align:center;';
      document.body.appendChild(t);
      setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 3500);
      setTimeout(function () { try { t.remove(); } catch (e) {} }, 4200);
    }
    // Periyodik kontrol: kuyruktaki kişi online olduysa bildirim mesajı yolla
    setInterval(function () {
      var q = loadOfflineCallQueue();
      if (!q.length) return;
      var remaining = [];
      q.forEach(function (item) {
        var connId = findLiveConnIdByNumber(item.number);
        if (!connId) {
          // 24 saatten eski denemeleri at
          if (Date.now() - item.ts < 24 * 3600 * 1000) remaining.push(item);
          return;
        }
        // Online! Sohbet kanalı üzerinden bilgilendirme mesajı yolla.
        // Engine'in outboundQueue/MSG yolu çağrılmalı; basit yaklaşım: peer DC üzerinden direkt gönder.
        try {
          var when = new Date(item.ts);
          var hh = String(when.getHours()).padStart(2, '0');
          var mm = String(when.getMinutes()).padStart(2, '0');
          var label = item.kind === 'video' ? 'görüntülü arama' : 'sesli arama';
          var text = '📞 Sizi ' + hh + ':' + mm + ' civarında bir ' + label + ' ile aramayı denedim (çevrimdışıydınız).';
          var msgId = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
          var sent = false;
          try {
            var p = (typeof peers !== 'undefined') ? peers : null;
            if (p && p[connId] && p[connId].dc && p[connId].dc.readyState === 'open') {
              p[connId].dc.send('MSG###' + msgId + '###' + text);
              sent = true;
            }
          } catch (e) {}
          // DC hazır değilse engine outboundQueue'ya at
          if (!sent) {
            try {
              var s = (typeof state !== 'undefined') ? state : window.state;
              if (s && s.outboundQueue && s.outboundQueue.set) {
                s.outboundQueue.set(msgId, { msgId: msgId, targetConnId: connId, text: text, ts: Date.now(), attempts: 0 });
                if (typeof saveOutbox === 'function') try { saveOutbox(); } catch (e) {}
              }
            } catch (e) {}
          }
        } catch (e) { console.warn('[adapter] offline call notify hata:', e); }
      });
      saveOfflineCallQueue(remaining);
    }, 6000);

    function formatOOElapsed(startedAt) {
      var elapsed = Math.max(0, Date.now() - (startedAt || Date.now()));
      var mins = Math.floor(elapsed / 60000);
      var secs = Math.floor((elapsed % 60000) / 1000);
      return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    function startOOCallTimer(startedAt) {
      if (ooCallTimer) clearInterval(ooCallTimer);
      var engineStartedAt = 0;
      try { engineStartedAt = Number(window.__SOHBETO_CALL_CONNECTED_AT || 0); } catch (e) {}
      ooCallStartedAt = startedAt || engineStartedAt || ooCallStartedAt || Date.now();
      var tick = function () {
        var el = document.getElementById('oocDuration');
        if (el) el.textContent = formatOOElapsed(ooCallStartedAt);
      };
      tick();
      ooCallTimer = setInterval(tick, 1000);
    }

    function stopOOCallTimer() {
      if (ooCallTimer) clearInterval(ooCallTimer);
      ooCallTimer = null;
      ooCallStartedAt = 0;
    }

    function startOOIncomingTimer() {
      if (ooIncomingTimer) clearInterval(ooIncomingTimer);
      ooIncomingStartedAt = Date.now();
      var tick = function () {
        var el = document.getElementById('ooiDuration');
        if (el) el.textContent = formatOOElapsed(ooIncomingStartedAt);
      };
      tick();
      ooIncomingTimer = setInterval(tick, 1000);
    }

    function stopOOIncomingTimer() {
      if (ooIncomingTimer) clearInterval(ooIncomingTimer);
      ooIncomingTimer = null;
      ooIncomingStartedAt = 0;
    }

    function resetOOIncomingDuration() {
      var el = document.getElementById('ooiDuration');
      if (!el) return;
      el.textContent = '00:00';
      el.style.visibility = 'hidden';
    }

    function isEngineCallVisible() {
      var src = document.getElementById('activeCallScreen');
      return !!(src && !src.classList.contains('hidden'));
    }

    function isEngineVideoActive() {
      var vc = document.getElementById('videoContainer');
      return !!(vc && vc.classList.contains('active'));
    }

    function openOOCallScreen(c, kind, opts) {
      var scr = document.getElementById('screen-ooCall');
      if (!scr) return;
      var wasHidden = scr.classList.contains('hidden-screen');
      scr.classList.remove('connected');
      var modeEl = document.getElementById('oocMode');
      var statusEl = document.getElementById('oocStatus');
      var avEl = document.getElementById('oocAvatar');
      var nmEl = document.getElementById('oocName');
      var durEl = document.getElementById('oocDuration');

      if (modeEl) modeEl.textContent = kind === 'video' ? 'Görüntülü Arama' : 'Sesli Arama';
      if (statusEl) statusEl.textContent = 'Çalıyor…';
      if (nmEl) nmEl.textContent = (c && c.name) || '—';
      if (durEl) {
        durEl.textContent = '00:00';
        // Çalıyor… durumunda süreyi gizle. "Bağlandı" olunca tekrar göster.
        if (opts && opts.startedAt) {
          durEl.style.visibility = 'visible';
        } else {
          durEl.style.visibility = 'hidden';
        }
      }
      if (avEl) {
        // Kart açıldıysa oradan, değilse initials
        var ccA = document.getElementById('ccAvatar');
        var inner = ccA && ccA.innerHTML.trim();
        avEl.innerHTML = inner || escapeHtml(getInitials(c && c.name, c && c.number));
      }
      // Sıfırla buton durumlarını
      ['oocMute','oocSpeaker','oocVideo'].forEach(function (id) {
        var b = document.getElementById(id); if (b) b.classList.remove('active');
      });
      scr.classList.remove('hidden-screen');
      scr.classList.add('active');
      if (wasHidden) {
        ooEngineActiveSeen = isEngineCallVisible() || isEngineVideoActive();
        // Sadece "kabul edilmiş" arama ise timer'ı hemen başlat.
        // Caller "Çalıyor…" durumunda timer durur; "Bağlandı" anında başlar.
        if (opts && opts.startedAt) {
          startOOCallTimer(opts.startedAt);
        } else {
          stopOOCallTimer();
          if (durEl) durEl.textContent = '00:00';
        }
      }
    }

    function closeOOCallScreen() {
      var scr = document.getElementById('screen-ooCall');
      if (!scr) return;
      scr.classList.add('hidden-screen');
      scr.classList.remove('active', 'connected', 'video-on');
      ooEngineActiveSeen = false;
      stopOOCallTimer();
      stopRingbackTone();
      clearOutgoingMute();
    }

    // Motorun stub #activeCallScreen / #activeCallStatus / #activeCallDuration değişimlerini OO'ya yansıt
    function bridgeEngineCallToOO() {
      var src = document.getElementById('activeCallScreen');
      if (!src) return;
      var lastHidden = src.classList.contains('hidden');

      // Status / duration polling (motor 1 sn'de bir günceller)
      setInterval(function () {
        var oo = document.getElementById('screen-ooCall');
        if (!oo || oo.classList.contains('hidden-screen')) return;
        var engineVisible = !src.classList.contains('hidden');
        var videoActive = isEngineVideoActive();
        if (engineVisible || videoActive) ooEngineActiveSeen = true;
        else if (ooEngineActiveSeen) { closeOOCallScreen(); return; }
        var st = (document.getElementById('activeCallStatus') || {}).innerText || '';
        var du = (document.getElementById('activeCallDuration') || {}).innerText || '';
        var oS = document.getElementById('oocStatus');
        var oD = document.getElementById('oocDuration');
        if (oS && st) oS.textContent = st;
        if (oD && du && du !== '00:00' && !ooCallTimer) oD.textContent = du;
        if (st === 'Bağlandı') {
          oo.classList.add('connected');
          if (oD) oD.style.visibility = 'visible';
          // Caller pending bekliyorduysa: ringback'i durdur, timer'ı 00:00'dan başlat
          if (ooOutgoingPending || !ooCallTimer) {
            stopRingbackTone();
            if (!ooCallTimer) {
              var connectedAt = 0;
              try { connectedAt = Number(window.__SOHBETO_CALL_CONNECTED_AT || 0); } catch (e) {}
              startOOCallTimer(connectedAt || Date.now());
            }
          }
        }
      }, 500);

      // Motor aramayı açıp/kapatınca OO'yu da senkronize et
      var mo = new MutationObserver(function () {
        var hidden = src.classList.contains('hidden');
        if (hidden && !lastHidden) {
          closeOOCallScreen();
        } else if (!hidden && lastHidden) {
          // Motor aktif arama ekranını AÇTI → OO ooCall ekranı açık değilse aç (callee için kritik).
          var oo = document.getElementById('screen-ooCall');
          if (oo && oo.classList.contains('hidden-screen')) {
            var vc = document.getElementById('videoContainer');
            var kind = (vc && vc.classList.contains('active')) ? 'video' : 'audio';
            var name = (document.getElementById('activeCallName') || {}).innerText || '—';
            var number = '';
            try {
              var st2 = getEngineState();
              if (st2 && st2.users) {
                st2.users.forEach(function (label) {
                  var m = String(label || '').match(/^(.*?)\s*\[(.*?)\]\s*$/);
                  if (!number && m && m[1].trim() === name.trim()) number = m[2];
                });
              }
            } catch (e) {}
            var acceptedStartedAt = ooAcceptedIncomingStartedAt || Date.now();
            ooAcceptedIncomingStartedAt = 0;
            openOOCallScreen({ name: name, number: number }, kind, { startedAt: acceptedStartedAt });
          }
          ooEngineActiveSeen = true;
          // Gelen arama ekranı varsa kapat
          closeOOIncomingScreen();
        }
        lastHidden = hidden;
      });
      mo.observe(src, { attributes: true, attributeFilter: ['class'] });
    }
    bridgeEngineCallToOO();

    // ---------- VIDEO KÖPRÜSÜ — engine #videoLocal/#videoRemote → OO sahnesi ----------
    // Engine srcObject'i offscreen stub'taki video element'lerine veriyor; biz
    // bu DOM node'larını OO sahnesine fiziksel olarak taşırız (ID'ler korunur,
    // engine erişmeye devam edebilir). Container 'active' olunca taşı, kalktığında geri koy.
    function bridgeVideoToOO() {
      var vc = document.getElementById('videoContainer');
      var stubHost = document.getElementById('__engine_stub_host__');
      var ooStageRemote = document.getElementById('oocVideoRemote');
      var ooStageLocal  = document.getElementById('oocVideoLocal');
      var ooScreen = document.getElementById('screen-ooCall');
      if (!vc || !ooStageRemote || !ooStageLocal || !ooScreen) return;

      var vlocal = document.getElementById('videoLocal');
      var vremote = document.getElementById('videoRemote');

      function moveToOO() {
        if (vlocal && vlocal.parentElement !== ooStageLocal) {
          vlocal.classList.remove('hidden');
          vlocal.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
          ooStageLocal.appendChild(vlocal);
        }
        if (vremote && vremote.parentElement !== ooStageRemote) {
          vremote.classList.remove('hidden');
          vremote.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
          ooStageRemote.appendChild(vremote);
        }
        ooScreen.classList.add('video-on');
        if (ooScreen.classList.contains('hidden-screen')) {
          var name = (document.getElementById('videoCallName') || {}).innerText
                  || (document.getElementById('activeCallName') || {}).innerText || '—';
          openOOCallScreen({ name: name }, 'video');
        }
        var modeEl = document.getElementById('oocMode');
        if (modeEl) modeEl.textContent = 'Görüntülü Arama';
        var vbtn = document.getElementById('oocVideo');
        if (vbtn) vbtn.classList.add('active');
      }
      function moveBack() {
        ooScreen.classList.remove('video-on');
        if (vlocal && stubHost && vlocal.parentElement !== stubHost) {
          vlocal.style.cssText = ''; vlocal.classList.add('hidden');
          stubHost.appendChild(vlocal);
        }
        if (vremote && stubHost && vremote.parentElement !== stubHost) {
          vremote.style.cssText = ''; vremote.classList.add('hidden');
          stubHost.appendChild(vremote);
        }
        var vbtn = document.getElementById('oocVideo');
        if (vbtn) vbtn.classList.remove('active');
      }

      var lastActive = vc.classList.contains('active');
      var mo = new MutationObserver(function () {
        var active = vc.classList.contains('active');
        if (active && !lastActive) moveToOO();
        else if (!active && lastActive) moveBack();
        lastActive = active;
      });
      mo.observe(vc, { attributes: true, attributeFilter: ['class'] });
      if (lastActive) moveToOO();
    }
    bridgeVideoToOO();

    // ---------- ÇEVRİMİÇİ/ÇEVRİMDIŞI KÖPRÜSÜ (chat header) ----------
    setInterval(function () {
      var st = getEngineState(); if (!st) return;
      var statusEl = document.querySelector('#screen-chat .chat-h-status');
      if (!statusEl) return;
      var connId = st.activeChat;
      if (!connId || connId === 'genel') { statusEl.textContent = ''; return; }
      var online = !!(st.users && st.users.has(connId));
      var dcOpen = false;
      var peersRef = null;
      try { peersRef = (typeof peers !== 'undefined') ? peers : (window.peers || null); } catch (e) {}
      try { dcOpen = !!(peersRef && peersRef[connId] && peersRef[connId].dc && peersRef[connId].dc.readyState === 'open'); } catch (e) {}
      var isOn = online || dcOpen;
      statusEl.textContent = isOn ? 'çevrimiçi' : 'çevrimdışı';
      statusEl.style.color = isOn ? 'var(--primary-green)' : 'var(--text-secondary)';
    }, 1000);

    // ---------- UYGULAMA KAPANIŞ → mevcut P2P üzerinden çevrimdışı bildirimi ----------
    // Sekme/PWA kapanırken aktif arama varsa CALL_END yolla, peer connection'ları
    // düzgünce kapat → karşı taraftaki dc.onclose + pc.onconnectionstatechange
    // engine.updateUI()'ı tetikler → liste/durumda anında çevrimdışı görünür.
    function gracefulShutdown() {
      try {
        try { if (typeof window.endActiveCall === 'function') window.endActiveCall(); } catch (e) {}
        var peersRef = null;
        try { peersRef = (typeof peers !== 'undefined') ? peers : (window.peers || null); } catch (e) {}
        if (peersRef) {
          Object.keys(peersRef).forEach(function (cid) {
            var p = peersRef[cid];
            try { if (p && p.dc && p.dc.readyState === 'open') p.dc.close(); } catch (e) {}
            try { if (p && p.pc) p.pc.close(); } catch (e) {}
          });
        }
        try { var st = getEngineState(); if (st && st.ws && st.ws.close) st.ws.close(); } catch (e) {}
        try { if (window.ws && window.ws.close) window.ws.close(); } catch (e) {}
      } catch (e) {}
    }
    window.addEventListener('pagehide', gracefulShutdown);
    window.addEventListener('beforeunload', gracefulShutdown);

    // ---------- GELEN ARAMA KÖPRÜSÜ (callee tarafı) ----------
    // Motor showIncomingCall() → #callScreen.hidden kalkar → OO #screen-ooIncoming açılır.
    function openOOIncomingScreen() {
      var scr = document.getElementById('screen-ooIncoming');
      if (!scr) return;
      var rawName   = (document.getElementById('callName')   || {}).innerText || '';
      var rawStatus = (document.getElementById('callStatus') || {}).innerText || '';
      var avSrc     = document.getElementById('callAvatar');
      var nm = document.getElementById('ooiName');   if (nm) nm.textContent = rawName || '—';
      var stE = document.getElementById('ooiStatus'); if (stE) stE.textContent = rawStatus || 'Seni arıyor…';
      var md = document.getElementById('ooiMode');
      if (md) md.textContent = /görüntü|video/i.test(rawStatus) ? 'Gelen Görüntülü Arama' : 'Gelen Sesli Arama';
      var av = document.getElementById('ooiAvatar');
      if (av) {
        if (avSrc && avSrc.innerHTML.trim()) av.innerHTML = avSrc.innerHTML;
        else av.textContent = (rawName.trim().split(/\s+/).map(function(p){return p[0]||'';}).join('').slice(0,2) || '?').toUpperCase();
      }
      scr.classList.remove('hidden-screen');
      scr.classList.add('active');
      stopOOIncomingTimer();
      resetOOIncomingDuration();
    }
    function closeOOIncomingScreen() {
      var scr = document.getElementById('screen-ooIncoming');
      if (!scr) return;
      scr.classList.add('hidden-screen');
      scr.classList.remove('active');
      stopOOIncomingTimer();
    }
    function bridgeEngineIncomingToOO() {
      var src = document.getElementById('callScreen');
      if (!src) return;
      var lastHidden = src.classList.contains('hidden');
      var mo = new MutationObserver(function () {
        var hidden = src.classList.contains('hidden');
        if (!hidden && lastHidden) openOOIncomingScreen();
        else if (hidden && !lastHidden) closeOOIncomingScreen();
        lastHidden = hidden;
      });
      mo.observe(src, { attributes: true, attributeFilter: ['class'] });
    }
    bridgeEngineIncomingToOO();

    window.ooiAccept = function () {
      // Motor: acceptCall() → startAudioCall/startVideoCall(callerConnId, true) →
      // #activeCallScreen açılır → bridgeEngineCallToOO OO ekranını da açar.
      ooAcceptedIncomingStartedAt = Date.now();
      var incomingDur = document.getElementById('ooiDuration');
      if (incomingDur) {
        incomingDur.textContent = '00:00';
        incomingDur.style.visibility = 'visible';
      }
      if (typeof window.acceptCall === 'function') {
        try { window.acceptCall(); } catch (e) { console.error('[adapter] acceptCall hata:', e); }
      }
    };
    window.ooiReject = function () {
      if (typeof window.rejectCall === 'function') {
        try { window.rejectCall(); } catch (e) { console.error('[adapter] rejectCall hata:', e); }
      }
      closeOOIncomingScreen();
    };

    // OO arama ekranı buton aksiyonları → motor fonksiyonlarına forward
    window.oocToggleMute = function () {
      var b = document.getElementById('oocMute'); if (b) b.classList.toggle('active');
      if (typeof window.toggleMute === 'function') window.toggleMute();
    };
    window.oocToggleSpeaker = function () {
      var b = document.getElementById('oocSpeaker'); if (b) b.classList.toggle('active');
      if (typeof window.toggleSpeaker === 'function') window.toggleSpeaker();
    };
    window.oocToggleVideo = function () {
      var b = document.getElementById('oocVideo'); if (b) b.classList.toggle('active');
      // Motor: toggleVideoInCall sesli aramayı görüntülüye çevirir
      if (typeof window.toggleVideoInCall === 'function') window.toggleVideoInCall();
    };
    window.oocHangup = function () {
      // Stabilite: CALL_END sinyalini birden fazla yoldan + retry ile gönder.
      var connId = null;
      try { connId = (typeof activeCallConnId !== 'undefined' && activeCallConnId) || ooOutgoingConnId || null; } catch (e) {}
      var sendEnd = function () {
        try { if (typeof sendCallSignal === 'function' && connId) sendCallSignal(connId, 'CALL_END'); } catch (e) {}
        try { if (typeof window.wsSend === 'function' && connId) window.wsSend('CALL_END', connId); } catch (e) {}
      };
      sendEnd();
      try { if (typeof window.endVideoCall === 'function') window.endVideoCall(); } catch (e) {}
      try { if (typeof window.endActiveCall === 'function') window.endActiveCall(); } catch (e) {}
      // Karşı taraf hâlâ "çalıyor" diyebiliyor → 250ms ve 800ms sonra tekrar dene
      setTimeout(sendEnd, 250);
      setTimeout(sendEnd, 800);
      stopRingbackTone();
      clearOutgoingMute();
      closeOOCallScreen();
    };

    // ---------- 2G) İlk ekranı göster ----------
    // Motor splash kullanıyor olabilir; OO'nun kendi splash'ı varsa onu da kapat
    setTimeout(function () {
      var splash = document.getElementById('screenSplash');
      if (splash) splash.classList.add('fade-out');
      // Eğer motor zaten kullanıcı login'liyse renderConvList çağrılıp enterMain devreye girecek
      // Aksi halde phone ekranı gösterilsin
      if (!enteredMain) showScreen('screen-phone');
    }, 600);

    console.info('[sohbeto-adapter] hazır — Adım 1 (login + sohbet listesi + chat) bağlandı.');
  });
})();
