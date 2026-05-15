# Sohbeto — Çoklu Arayüz Entegrasyon Rehberi

Bu klasörde 3 ana dosya var:

```
public/apps/
├─ sohbeto-engine.js     # MOTOR — dokunma! (WebSocket, WebRTC, IndexedDB, kişi/sohbet state)
├─ sohbeto-adapter.js    # KÖPRÜ — UI ↔ Motor arasındaki tüm dönüşümler burada
└─ sohbetoOO.html        # 1. Arayüz (WhatsApp benzeri "OO" teması) — referans implementasyon
```

> **Kural:** `sohbeto-engine.js` HİÇ değişmez. Yeni bir tema/arayüz eklemek için
> sadece **HTML** ve **adapter**'ın o temaya özel bölümü yazılır.

---

## 1) Mimarinin Temeli

Motor, kendi DOM'unu beklediği **stub ID'ler** üzerinden günceller (`#contactList`,
`#convListOzel`, `#topbarTitle`, `#welcomeNumber`, `#btnSendCode`, ...).
Adapter iki şey yapar:

1. **Stub ID'leri görünmez şekilde sayfaya enjekte eder** (`__engine_stub_host__` div'i).
   Böylece motor patlamaz.
2. **Motorun stub DOM'unu okuyup gerçek arayüze yansıtır** ve gerçek arayüzün
   tıklamalarını motorun beklediği fonksiyon/click'lere çevirir.

Akış:

```
Kullanıcı → [Tema HTML]  →  [adapter.js]  →  [engine.js]  →  WebSocket / WebRTC
                                  ↑                ↓
                                  └──── stub DOM ──┘
```

---

## 2) Yükleme Sırası (HER tema için)

```html
<!-- 1) Adapter MOTOR'DAN ÖNCE yüklenir → stub'lar hazır olsun -->
<script src="./sohbeto-adapter.js"></script>

<!-- 2) Motor -->
<script src="./sohbeto-engine.js"></script>
```

Adapter `DOMContentLoaded` öncesi stub host'u eklemeye çalışır; motor da `load`
sonrası hazır kabul edilir.

---

## 3) Bir Tema Hazırlarken Sağlaman Gereken DOM Sözleşmesi

Aşağıdaki ID/sınıflar arayüzünde **kesinlikle** olmalı (yoksa adapter çalışmaz).
İsim aynı kalmak şartıyla görünüm/animasyon tamamen sana ait.

### A) Ekran (screen) iskeleti

Adapter `showScreen(id)` ile ekranlar arasında geçiş yapar. Tüm ekranlar
`.app-container > .screen` altında olmalı; gizleme için `.hidden-screen`,
aktif için `.active` sınıfı kullanılır.

| Ekran ID           | İçerik                     |
| ------------------ | -------------------------- |
| `screen-phone`     | Telefon numarası girişi    |
| `screen-auth`      | OTP (6 haneli kod) ekranı  |
| `screen-sohbetler` | Sohbet listesi (ana ekran) |
| `screen-kisiler`   | Kişiler listesi            |
| `screen-gruplar`   | Gruplar listesi            |
| `screen-ayarlar`   | Ayarlar                    |
| `screen-chat`      | Sohbet detay               |

### B) Giriş akışı (Adım 1)

| Eleman                                | Görev                                               |
| ------------------------------------- | --------------------------------------------------- |
| `#phoneInput`                         | Telefon numarası input                              |
| `#codeInputs .code-input` (×6)        | OTP kutuları                                        |
| `#authPhoneLabel`                     | OTP ekranındaki numara etiketi                      |
| `app.sendCode()` / `app.verifyCode()` | Adapter expose eder; butonların `onclick`'ine bağla |

### C) Sohbet listesi (Adım 1)

Adapter `renderConvList`'i monkey-patch eder ve motorun `#convListOzel` stub'ından
**`#screen-sohbetler .content-area`** içine kopyalar. Yani temada bu container'ı
hazırlaman yeterli — adapter dolduracak.

### D) Sohbet ekranı (Adım 1)

| Eleman                               | Görev                                      |
| ------------------------------------ | ------------------------------------------ |
| `#chatHName`                         | Üst bar isim                               |
| `#chatHAvatar`                       | Üst bar avatar                             |
| `#chatMessages`                      | Mesaj listesi container'ı                  |
| `#chatInput`                         | Mesaj input (`oninput="updateSendIcon()"`) |
| `#chatSendBtn`                       | Gönder butonu (`onclick="onSendBtn()"`)    |
| `closeChat()`                        | Geri butonu                                |
| `chatCall/More/Next/Attach/Camera()` | Adım 5+ için stub; çağırabilirsin (no-op)  |

### E) Kişiler (Adım 2)

| Eleman                                                     | Görev                                         |
| ---------------------------------------------------------- | --------------------------------------------- |
| `#contactsList`                                            | Adapter buraya `.contact-row`'ları yazar      |
| `#contactsEmpty`                                           | "Boş" durumu (adapter göster/gizler)          |
| `#contactSearch` (input)                                   | `oninput="renderContacts()"`                  |
| `#addContactSheet` + `#newContactName`, `#newContactPhone` | Yeni kişi sheet'i; "Kaydet" → `saveContact()` |
| `openAddContact()` / `closeAddContact()`                   | Sheet aç/kapat                                |

### F) Kişi Kartı (Adım 3 — bu adımda eklendi)

Kişi listesinde bir satıra tıklanınca adapter, motorun chat'ini açmak yerine
**OO'nun kişi kartı overlay'ini açar** ve veriyi DOM'dan okuyup doldurur.

| Eleman                                | Görev                                                               |
| ------------------------------------- | ------------------------------------------------------------------- |
| `#contactCardOverlay`                 | Modal container; `.open` / `.closing` sınıflarıyla animasyon        |
| `#ccAvatar`                           | Avatar (resim varsa `<img>`, yoksa baş harfler)                     |
| `#ccName`                             | Kişi adı                                                            |
| `#ccPhone`                            | Telefon                                                             |
| `ccCall()` / `ccVideo()` / `ccInfo()` | Buton stub'ları (Adım 5/6'da bağlanacak)                            |
| `ccOpenChat()`                        | Mesaj Gönder — Adım 4'te `openContactByNumber`'a bağlanacak iskelet |
| `closeContactCard(ev)`                | Overlay backdrop'una tıklamada animasyonlu kapatır                  |

> **Veri kaynağı:** Adapter, listeyi render ederken her satıra
> `data-name`, `data-number`, `data-connid`, `data-engine-index` koyuyor.
> Kart açılışında bu attribute'lar okunur — yeni temada bu data-attr'lara
> dokunmana gerek yok, onları adapter üretiyor.

### G) Alt navigasyon

| Eleman                                                      | Görev                           |
| ----------------------------------------------------------- | ------------------------------- |
| `#bottom-nav`                                               | Alt bar container               |
| `.nav-item` + `#nav-{sohbetler\|kisiler\|gruplar\|ayarlar}` | `onclick="app.navigate('...')"` |

---

## 4) Yeni Tema Eklerken Adım Adım

1. **HTML kopyala:** `sohbetoOO.html`'i `sohbetoXX.html` olarak çoğalt.
2. **Stilleri değiştir:** Renk/layout/animasyon tamamen serbest. **ID'lere
   dokunma**, `class`'ları kendi sistemine göre yeniden yazabilirsin.
3. **Yükleme sırasını koru:** `<head>`'in sonunda `sohbeto-adapter.js`,
   sonra `sohbeto-engine.js`.
4. **Sözleşme kontrolü:** Yukarıdaki tablolardaki ID'lerin / global fonksiyon
   çağrılarının (`app.navigate`, `app.sendCode`, `app.verifyCode`,
   `openAddContact`, `saveContact`, `closeChat`, `onSendBtn`,
   `closeContactCard`, `cc*`) hepsinin temada karşılığı olduğundan emin ol.
5. **Tema-spesifik UI hook'ları:** Eğer temanda adapter'ın bilmediği bir
   davranış varsa (örn. özel "stories" carousel'i), o tema için ayrı bir
   `sohbeto-adapter-XX.js` yazıp **adapter'dan SONRA** yükle ve sadece
   ek davranışı orada tanımla. Ana adapter'ı kirletme.

---

### H) Arama Ekranı (Adım 4 — bu adımda eklendi)

Motor (`engine.js`) sesli/görüntülü aramayı **kendi** stub ekranlarında
(`#activeCallScreen`, `#videoContainer`) yönetir. Tema bunları gösteremez —
çünkü stub'lar görünmez div içinde. Bu yüzden **her tema kendi arama ekranını**
çizer ve adapter, motor↔tema arasında köprü kurar.

| Eleman                                                                        | Görev                                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `#screen-ooCall` (tema-spesifik ID olabilir)                                  | Tam ekran arama overlay'i; `.hidden-screen` ile aç/kapat                                                     |
| `#oocAvatar`                                                                  | Aranan kişinin avatarı                                                                                       |
| `#oocName`                                                                    | Aranan kişinin adı                                                                                           |
| `#oocStatus`                                                                  | "Çalıyor…" / "Bağlandı" — adapter motorun `#activeCallStatus`'undan kopyalar                                 |
| `#oocDuration`                                                                | "00:00" — çağrı **kabul edilene kadar gizli**, kabul anında 00:00'dan başlar                                 |
| `#oocMode`                                                                    | "Sesli Arama" / "Görüntülü Arama"                                                                            |
| `oocToggleMute()` / `oocToggleSpeaker()` / `oocToggleVideo()` / `oocHangup()` | Buton aksiyonları — adapter `toggleMute/toggleSpeaker/toggleVideoInCall/endActiveCall` motoruna forward eder |

Adapter, kart üzerinden `ccCall()` / `ccVideo()` veya chat üst barından
`chatCall()` / `chatVideo()` çağırıldığında:

1. `_activeCard` (kart) ya da `state.activeChat` (sohbet) üzerinden `connId`'yi çözer.
2. `connId` yoksa → `openContactByNumber(number)` ile önce LOOKUP atar; kullanıcıya
   "kişi çevrimiçi olunca tekrar arayın" notu düşer.
3. OO arama ekranını açar (`openOOCallScreen`) ve motorun `startAudioCall(connId,false)`
   veya `startVideoCall(connId,false)` fonksiyonunu çağırır.
4. `MutationObserver` ile motorun `#activeCallScreen` `.hidden` sınıfını izler;
   motor aramayı kapatınca OO ekranını da kapatır.

> **Yeni tema eklerken:** Yukarıdaki ID'leri (`#screen-ooCall`, `#oocAvatar`, `#oocName`,
> `#oocStatus`, `#oocDuration`, `#oocMode`) **aynı tutmak zorunda değilsin**;
> ama tutarsan adapter'ı kirletmezsin. Eğer farklı ID'ler kullanmak istiyorsan,
> tema-özel `sohbeto-adapter-XX.js` yazıp ana adapter'ın `openOOCallScreen` /
> `closeOOCallScreen` / `bridgeEngineCallToOO` fonksiyonlarını **override** et —
> motor tarafına dokunma.

### H2) Gelen Arama Ekranı — ZORUNLU (callee tarafı, Adım 4'te eklendi)

> **DİKKAT:** Bu ekran olmadan **arama bağlantısı kurulamaz**. Karşı taraf
> CALL_RING sinyalini P2P data channel üzerinden alır, motor stub `#callScreen`'i
> görünür yapar — ama o stub görünmez offscreen div içindedir. Tema kendi
> "Gelen Arama" ekranını çizmek **zorundadır**, aksi halde callee bildirimi
> göremez ve aramayı kabul edemez.

| Eleman               | Görev                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| `#screen-ooIncoming` | Tam ekran "gelen arama" overlay'i; `.hidden-screen` ile aç/kapat               |
| `#ooiAvatar`         | Arayanın avatarı (adapter motorun `#callAvatar` HTML'ini kopyalar)             |
| `#ooiName`           | Arayanın adı (adapter motorun `#callName`'inden okur)                          |
| `#ooiStatus`         | "Seni Arıyor..." / "Görüntülü arıyor..." (adapter `#callStatus`'tan kopyalar)  |
| `#ooiMode`           | "Gelen Sesli Arama" / "Gelen Görüntülü Arama" (adapter status'a göre belirler) |
| `#ooiDuration`       | Gelen çağrıda beklerken gizli kalır; kullanıcı kabul edince 00:00 görünür olur |
| `ooiAccept()`        | Kabul butonu — adapter motorun `acceptCall()` fonksiyonunu çağırır             |
| `ooiReject()`        | Reddet butonu — adapter motorun `rejectCall()` fonksiyonunu çağırır            |

Adapter akışı:

1. `MutationObserver` ile motor stub'ı `#callScreen` `.hidden` sınıfı kalkınca
   `openOOIncomingScreen()` çağrılır → tema ekranı açılır, içerik motor stub'ından
   doldurulur.
2. Kullanıcı "Kabul" → `ooiAccept()` → motor `acceptCall()` →
   `startAudioCall(callerConnId, true)` → motor stub `#activeCallScreen` görünür olur.
3. `bridgeEngineCallToOO` MutationObserver'ı `#activeCallScreen` AÇILDIĞINI da algılar
   ve **otomatik olarak** OO `#screen-ooCall` ekranını da açar (caller hâlâ "Çalıyor…",
   callee artık "Bağlandı"). Bu sayede tema, kabulden sonra ek bir aksiyon yazmak
   zorunda değil.
4. Kullanıcı "Reddet" → `ooiReject()` → motor `rejectCall()` → CALL_REJECT P2P ile
   karşı tarafa gider → caller'ın aktif arama ekranı kapanır.

**Yeni tema eklerken çalışan tam çağrı zinciri (özet):**

```
A (caller)                                      B (callee)
─────────────────────────────────────────────────────────────────
ccCall() / chatCall()                           (P2P beklemede)
  → startCallFromCard / startCallForActiveChat
  → openOOCallScreen("Çalıyor…")
  → engine.startAudioCall(connId, false)
      → engine.initP2P(connId)  ── OFFER ─────► engine.handleSignaling("OFFER")
                                  ◄── ANSWER ── engine.sendSignaling("ANSWER")
                                  ◄── ICE ────►
                                  (data channel açılır)
      → engine.sendCallSignal("CALL_RING") ───► engine.handleP2PMsg("CALL_RING")
                                                 → engine.showIncomingCall()
                                                   → #callScreen.hidden kalkar
                                                 → adapter.openOOIncomingScreen()
                                                   → #screen-ooIncoming GÖRÜNÜR ✅
                                                 [B kullanıcısı "Kabul" basar]
                                                 → ooiAccept()
                                                 → engine.acceptCall()
                                                   → engine.startAudioCall(connId, true)
                                                     → #activeCallScreen.hidden kalkar
                                                     → adapter MutationObserver →
                                                        openOOCallScreen() açılır
                                  ◄── CALL_ACCEPT ─ engine.sendCallSignal()
engine.handleCallSignal("CALL_ACCEPT")
  → activeCallStatus = "Bağlandı"
  → startCallTimer()
  → adapter polling oocStatus = "Bağlandı"
```

**Eğer "kişi çevrimiçi ama arama bildirimi karşı tarafa gitmiyor" hatası
yaşıyorsan**, sırasıyla şunları kontrol et (zaten doğru kurulduysa hepsi geçer):

1. Tema HTML'inde `#screen-ooIncoming` ve içindeki `#ooiAvatar`, `#ooiName`,
   `#ooiStatus` ID'leri **var mı**? (Yoksa adapter köprüsü yazacak yer bulamaz.)
2. `<head>` sırası doğru mu? Önce `sohbeto-adapter.js`, sonra `sohbeto-engine.js`.
3. `acceptCall` ve `rejectCall` motorda `function` olarak tanımlı (engine.js:631-645);
   `window.acceptCall` üzerinden çağrılabilir olmalı. Motor değişmedikçe sorun yok.
4. `peers[connId]?.dc?.readyState === 'open'` mu? Konsolda
   `Object.entries(peers).map(([k,v])=>[k,v.dc?.readyState])` ile bak. Açık değilse
   motor `sendWhenP2PReady` 6 sn boyunca retry eder; bu sürede ICE/STUN tamamlanmazsa
   CALL_RING ulaşmaz. Bu durum **adapter sorunu değil**, network/STUN sorunudur —
   `CONFIG.iceServers` içine TURN ekle.

### H3) Görüntülü Arama Sahnesi — ZORUNLU (her tema)

> **DİKKAT:** Motor `startVideoCall()` içinde local & remote video element'lerini
> stub `#videoLocal` ve `#videoRemote` div'lerine basar; bunlar offscreen stub
> host'un içindedir, dolayısıyla **görünmezler**. Tema kendi sahnesini açmazsa
> arama bağlanır ama kullanıcı kendisini ya da karşı tarafı **göremez**.

| Eleman                    | Görev                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| `.ooc-video-stage`        | `#screen-ooCall` içinde `position:absolute;inset:0` tam-kaplama sahne |
| `#oocVideoRemote`         | Karşı tarafın videosu için boş kapsayıcı (sahnenin tamamı)            |
| `#oocVideoLocal`          | Kendi kameranın küçük PIP kapsayıcısı (sağ üst, ~28% genişlik)        |
| `#screen-ooCall.video-on` | Sahne görünür olduğunda eklenen sınıf — avatar/isim gizlenir          |

Adapter (`bridgeVideoToOO`) çalışma mantığı:

1. `MutationObserver` motorun `#videoContainer` div'inin `class` değişikliğini izler.
2. `.active` sınıfı eklendiğinde **stub içindeki `#videoLocal` ve `#videoRemote`
   DOM node'ları fiziksel olarak `#oocVideoLocal` / `#oocVideoRemote` içine taşınır**
   (ID'ler korunduğu için engine bu node'lara erişmeye devam eder).
3. `screen-ooCall` görünür değilse otomatik açılır, `oocMode = "Görüntülü Arama"`,
   `oocVideo` butonu `.active` olur.
4. `.active` sınıfı kalktığında (arama biter) node'lar tekrar offscreen stub
   host'a geri taşınır ve `.hidden` sınıfı eklenir.

> **Yeni tema eklerken:** `.ooc-video-stage`, `#oocVideoRemote`, `#oocVideoLocal`
> ID'lerini **aynen kullan**. CSS'de `video { width:100%; height:100%; object-fit:cover; }`
> kuralı şart — yoksa tarayıcı varsayılan `300x150` boyutunu uygular ve
> görüntü minik kalır.

### H4) Çevrimiçi/Çevrimdışı Yansıması

Adapter her saniye `getEngineState().users` haritasını ve `peers[connId].dc.readyState`
durumunu kontrol eder; aktif sohbetin chat header'ındaki `.chat-h-status` text'ini
**"çevrimiçi" / "çevrimdışı"** olarak günceller. Tema sadece `#screen-chat .chat-h-status`
elementini bulundurmalıdır.

### H5) Uygulama Kapanışı — Çevrimdışı Bildirimi

> Önceden, kullanıcı sekmeyi/PWA'yı kapatınca karşı taraf bunu sadece WebSocket
> sunucusu sezdiğinde (genelde 30+ sn sonra) görürdü. Adapter artık `pagehide`
> ve `beforeunload` olaylarında:
>
> 1. Aktif aramayı `endActiveCall()` ile sonlandırır (CALL_END P2P sinyali yollar).
> 2. Tüm `peers[*]` data channel'larını ve peer connection'larını **düzgünce kapatır**.
>    → Karşı tarafta `pc.onconnectionstatechange` + `dc.onclose` tetiklenir →
>    `engine.updateUI()` o kullanıcıyı **anında** çevrimdışı olarak yeniden çizer.
> 3. WebSocket'i kapatır.
>
> Tema tarafında ek bir kod gerekmiyor — hangi tema yüklenirse yüklensin bu
> garantili çalışır.

### H6) Responsive Pad — OS Nav Bar / Klavye

Sohbeto bir iframe içinde GüneşOS pencere yöneticisi tarafından gösteriliyor;
mobil/tabletde alt 64px civarı sistem nav bar var. Bu yüzden tam-ekran
overlay'lerde (`#screen-ooCall`, `#screen-ooIncoming`) **alt padding mutlaka**:

```css
padding-bottom: calc(max(22px, env(safe-area-inset-bottom)) + 72px);
```

olmalı. Aksi halde "Kabul / Reddet" gibi en alttaki butonlar nav bar'ın
altında kalır.

### H7) Arama Kapanışı + Sayaç Senkronu

OO arama ekranı artık motorun `#activeCallScreen` ve `#videoContainer` durumunu
500 ms polling + `MutationObserver` ile izler. Motor tarafı aramayı gizlediğinde
veya görüntülü arama `active` sınıfını kaldırdığında tema ekranı da **mutlaka kapanır**;
bu yüzden "Bağlandı" ekranında takılı kalma olmamalıdır.

Sayaç davranışı motor + adapter birlikte garanti eder:

| Eleman / Durum | Görev                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `#oocDuration` | Arayan tarafta `Çalıyor…` sırasında gizlidir; `CALL_ACCEPT###connectedAt` gelince görünür ve 00:00'dan akar    |
| `#ooiDuration` | Aranan tarafta gelen çağrı beklerken gizlidir; kabul basılınca görünür ve aktif çağrı ekranıyla senkron başlar |
| `ooiAccept()`  | Kabul anında `connectedAt` damgası üretir; engine bunu `CALL_ACCEPT###timestamp` olarak caller'a yollar        |
| `oocHangup()`  | Hem `endActiveCall()` hem de video temizliği için `endVideoCall(true)` çağırır                                 |

> **Yeni tema eklerken:** Aktif arama ekranında `#oocDuration`, gelen arama ekranında
> `#ooiDuration` bulunsun. Farklı ID kullanılırsa tema-özel adapter bu iki sayacı
> ayrıca yönetmelidir. Artık süreyi "aranıyor / çalıyor" anında göstermiyoruz; iki taraf da
> kabul anında aynı timestamp üzerinden başlar.

### H8) Aynı Tarayıcıda Çoklu Sekme — Tab ID Namespace

Bu projede test ederken aynı tarayıcıda iki ayrı sekmede farklı numaralar açılabiliyor.
Normalde `localStorage` ve `IndexedDB` aynı origin'de **ortaktır**; yani iki sekme aynı
kimliği, outbox kuyruğunu ve mesaj veritabanını paylaşır. Bu da "farklı numarayla girdim
ama davranışlar karıştı" hissi yaratır.

Engine tarafına `SOHBETO_TAB_ID` eklendi:

- Her sekme `sessionStorage` içinde kendine ait `sohbeto_tab_id_v1` üretir.
- IndexedDB adı artık `EgaNetwork_${tabId}` olur; kimlik/rehber/mesajlar sekme bazında ayrılır.
- Outbox localStorage anahtarı `sohbet_outbox_v5__${tabId}` olarak tutulur.
- Cache versiyon anahtarı da `sessionStorage`'a alındı; bir sekmedeki değişim diğer sekmeyi zorla yenilemez.

> **Yeni tema için not:** Bu davranış engine seviyesindedir; tema HTML'i veya adapter ekstra
> bir şey yapmaz. Bir sekmeyi çoğaltırsan tarayıcı bazen `sessionStorage`'ı kopyalayabilir;
> en temiz test için yeni sekmede/ayrı pencere açıp kayıt akışını yeniden başlat.

### I) Mesaj Balonu Hizalama Köprüsü (Adım 1 → Adım 4'te netleştirildi)

Motor mesajları şu DOM'la üretir:

```html
<div class="msg msg-own">
  <!-- veya msg-other / msg-private -->
  <div class="msg-bubble">
    <div class="msg-meta"><span class="msg-tag">…</span></div>
    <div>Mesaj metni</div>
    <div class="msg-meta"><span class="msg-time">14:32</span><span class="tick">✓</span></div>
  </div>
</div>
```

Tema, **`.msg`'yi flex** yapıp `.msg-own → flex-end`, `.msg-other/.msg-private → flex-start`
hizalamalı. `.msg-bubble`'ın iç stili (renk/padding/radius) tema serbest, ancak
`.msg-tag` / `.msg-time` / `.tick` için kendi temasında okunur kontrast vermeli.
OO'da örneği: `sohbetoOO.html` içinde "Motor mesaj balonu hizalama köprüsü" yorum bloğu.

---

## 5) Yol Haritası (Adımlar)

| Adım | Kapsam                                                                                                                              | Durum     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1    | Login + Sohbet listesi + Chat ekranı + balon hizalama                                                                               | ✅ Bitti  |
| 2    | Kişiler listesi + Yeni kişi ekleme                                                                                                  | ✅ Bitti  |
| 3    | Kişi kartı overlay (avatar/isim/telefon + animasyon)                                                                                | ✅ Bitti  |
| 4    | "Mesaj Gönder" → sohbet aç + Sesli/Görüntülü arama ekranı (caller) + Gelen arama ekranı (callee, `#screen-ooIncoming`)              | ✅ Bitti  |
| 4b   | Çağrı UX sertleştirme: ringback tonu, accept'e kadar mikrofon kapalı, eşzamanlı 00:00 timer, hangup retry, çevrimdışı çağrı kuyruğu | ✅ Bitti  |
| 5    | Mikrofon basılı tut → sesli mesaj, dosya/medya gönderme                                                                             | ⏳ Sırada |
| 6    | Bilgi paneli, gruplar, ayarlar, bildirimler                                                                                         | ⏳        |

---

## 6.0) Adım 4b/4c — Çağrı UX & Stabilite (yeni temalar için sözleşme)

Bu adımda ana yük yine **adapter + HTML** tarafındadır; ancak görüntülü çağrının
kabul öncesi kendiliğinden düşmemesi ve kabul sonrası sürenin tek kaynakla akması
için engine tarafında da küçük, güvenli sinyal düzeltmeleri vardır. Yeni bir tema
yazarken çağrı ekranınızda aşağıdaki davranışları aynen koruyun — adapter bunları
otomatik bağlar:

### 6.0.1) Caller (arayan) akışı

```
[Kart "Ara"] → openOOCallScreen(c, kind)
            → "Çalıyor…" görünür, süre 00:00 (DURUR)
            → startRingbackTone()             // yerel ringback (425Hz pattern)
            → muteOutgoingTracksUntilAccepted(connId)
              ├─ engine'in localAudioStream / localVideoStream / peers[connId].pc
              │  sender'larındaki audio track'leri 200ms'de bir enabled=false yapar
              └─ #activeCallStatus === 'Bağlandı' olunca:
                  • ringback durur
                  • track'ler oocMute butonuna saygıyla yeniden enabled olur
                  • OO timer 00:00'dan tick'lemeye başlar
```

### 6.0.2) Callee (alan) akışı

- Engine `acceptCall()` → `startAudioCall/startVideoCall(connId, true)` → status = 'Bağlandı'
- bridge bu anı yakalar ve OO call ekranını **aynı anda** 00:00'dan başlatır.
- Böylece iki taraf **eş zamanlı** sayar.

### 6.0.2a) Cevapsız görüntülü çağrı kuralı

- Engine artık `showIncomingCall()` içinde 30 saniyelik otomatik `rejectCall()` çalıştırmaz.
- Sebep: görüntülü çağrıda kamera/mikrofon izni ve P2P hazırlığı uzayınca, kullanıcı kabul etmeden
  çağrı kendiliğinden düşmüş gibi görünüyordu.
- Yeni kural: kabul edilmemiş çağrı yalnızca arayan kapatırsa (`CALL_END`), alıcı reddederse
  (`CALL_REJECT`) veya taraflardan biri gerçekten aramayı bitirirse kapanır.
- Yeni tema bu davranış için ekstra kod yazmaz; sadece `#screen-ooIncoming` ekranını doğru göstermelidir.

### 6.0.3) Hangup stabilitesi

`window.oocHangup()` artık:

1. `sendCallSignal(connId, 'CALL_END')` + ham `wsSend('CALL_END', connId)` çağırır,
2. `endVideoCall()` + `endActiveCall()` çağırır,
3. Aynı `CALL_END`'i 250ms ve 800ms sonra tekrar gönderir (paket kaybına karşı),
4. Ringback / track-mute poll'ünü temizler, OO ekranını kapatır.

### 6.0.4) Çevrimdışı çağrı kuyruğu (caller tarafı)

- LOOKUP 3.5sn içinde sonuç vermezse: arama iptal, kişi `localStorage` kuyruğuna
  alınır (`oo_offline_call_queue_v1`), kullanıcıya kısa toast gösterilir.
- Adapter her 6 saniyede bir kuyruğu tarar; kişi `state.users` içinde göründüğü
  an, P2P DataChannel açıksa **direkt** `MSG###<id>###📞 Sizi HH:MM civarında
aramayı denedim …` mesajını yollar; kanal hazır değilse engine'in
  `state.outboundQueue`'suna ekler. 24 saat sonra denemeden vazgeçer.

### 6.0.5) Yeni temalar için zorunlu DOM

Aşağıdaki ID'ler değişmemeli — adapter bunları okur/yazar:

| ID                  | Görev                                                    |
| ------------------- | -------------------------------------------------------- |
| `screen-ooCall`     | Caller / aktif çağrı ekranı kapsayıcısı                  |
| `oocStatus`         | "Bağlanılıyor… / Çalıyor… / Bağlandı"                    |
| `oocDuration`       | "MM:SS" (caller için 00:00, sadece Bağlandı'da tick'ler) |
| `oocMute`           | Mikrofon sustur butonu (`.active` class'ı = sessiz)      |
| `oocSpeaker`        | Hoparlör butonu                                          |
| `oocVideo`          | Sesli → görüntülü geçiş butonu                           |
| `screen-ooIncoming` | Gelen çağrı ekranı                                       |
| `ooiDuration`       | Gelen çağrı bekleme süresi                               |

### 6.0.6) Görüntülü çağrıda süre görünürlüğü

- `#screen-ooCall.video-on` aktifken avatar ve isim gizlenebilir; fakat `#oocDuration`
  **gizlenmemelidir**. OO temasında süre video sahnesinin üstünde sabit gösterilir.
- Adapter `startOOCallTimer()` artık `#oocDuration` ile birlikte motor stub'ları
  `#activeCallDuration` ve `#videoCallDuration` alanlarını da günceller.
- Engine `startCallTimer()` her tick'te `#activeCallStatus = "Bağlandı"` yazar; böylece
  görüntülü aramada "Çalıyor…" yazısı kabulden sonra kalıcı olamaz.

### 6.0.6) Engine.js'e DOKUNULMASI GEREKEN potansiyel iyileştirmeler

Bunlar **şu an yapılmadı** — adapter workaround ile yetiniyor. Daha temiz/hızlı
bir akış istersen aşağıdaki noktalarda engine.js'e ufak ekler gerekir, bana
bildirip onay verirsen uygularım:

1. **Gerçek "ring before media"**: Şu anda `startAudioCall(connId, false)`
   `getUserMedia` + `initP2P`'yi hemen çağırıyor; biz track'i adapter'da
   `enabled=false` yapıyoruz ama PC negotiation yine de başlıyor. Temiz
   çözüm: outgoing tarafta önce sadece `sendCallSignal('CALL_RING')` atıp
   `getUserMedia`'yı `CALL_ACCEPT` geldiğinde yapmak.
   _Önerilecek değişiklik: `startAudioCall` içinde `if (!isIncoming) { … sadece
sinyal yolla, mediayı acceptCall handler'ında başlat … }` ayrımı._

2. **`CALL_MISSED` sinyali**: Çevrimdışı çağrı bildirimini şu an sıradan
   `MSG###` paketi olarak yolluyoruz (kullanıcıya chat balonu olarak görünür).
   Daha düzgün: ayrı bir `CALL_MISSED` sinyali + alıcı tarafta "X seni aradı"
   sistem balonu / bildirim. _Önerilecek: `handleCallSignal` içine
   `CALL_MISSED###<kind>###<ts>` case'i ekle._

3. **`CALL_END` ACK**: Şu an `CALL_END` ack'siz yollanıyor; adapter 3 kez
   tekrar gönderiyor ama yine de paket kaybına açık. Engine'de
   `CALL_END_ACK` ekleyip caller `ACK` gelene dek 200ms'de bir 5 kez
   denerse "karşı taraf hâlâ çalıyor" durumu tamamen kapanır.

4. **Ringback engine içinde**: Ringback tonunu adapter sentezliyor; engine'e
   alınırsa tüm temalar için tek noktadan stabil olur.

---

## 6) Hata Ayıklama İpuçları

- Konsolda `[adapter] ...` logları her köprü noktasında çıkar.
- Motor "stub bulunamadı" diye patlarsa, eksik ID'yi adapter'daki `STUB_IDS`
  listesine ekle (görünmez div olarak basılır).
- `window.openChat`, `window.saveNewContact`,
  `window.updateContactList`, `window.renderConvList` motorun expose ettiği
  ana giriş noktalarıdır — bunları çağırmak güvenli.
- `contactsState` motor tarafında `const` ama `<script>` global scope'unda;
  başka bir `<script>`'ten okunabilir (adapter Adım 3'te bunu kullanıyor).
- `state` de motor tarafında `const` olduğu için her tarayıcıda `window.state`
  olarak görünmeyebilir. Yeni tema adapter'larında canlı kullanıcı kontrolü için
  önce `typeof state !== 'undefined' ? state : window.state` mantığını kullan;
  aksi halde online kişi yanlışlıkla çevrimdışı sayılır.
- Numara eşleştirmelerinde mutlaka normalize edilmiş formatı (`+905...`) baz al.
  Motor `state.users` içinde kişiyi genelde `Ad [telefon]` etiketiyle tutar;
  adapter bu etiketten canlı `connId` bulup sonra `openChat/startAudioCall` çağırmalı.

---

## H8) Sohbet Ekranı + Mesaj Kutusu — ZORUNLU (P2P-only)

Yeni temalarda sohbet ekranı ve mesaj kutusu **şu sözleşmeye uymak zorundadır**.
Motor (sohbeto-engine.js) tüm özel mesajları `sendSecureP2PWhenReady()` ile
gönderir; WSS sadece "tanıştırma" (kullanıcı bulma + WebRTC sinyalleşme)
için kullanılır. Mesaj içeriği ASLA WSS üzerinden gitmez.

### H8.1) Zorunlu DOM ID'leri (sohbet ekranı)

| ID              | Tür       | Görev                                                      |
| --------------- | --------- | ---------------------------------------------------------- |
| `screen-chat`   | container | Sohbet ekranının dış kapsayıcısı (full overlay).           |
| `chatHName`     | text      | Sohbet üst başlığında kişi adı.                            |
| `chatHAvatar`   | div       | Sohbet üst başlığında avatar.                              |
| `chat-h-status` | class     | Header altındaki "çevrimiçi/çevrimdışı" satırı (H4).       |
| `chatMessages`  | scroller  | Motor balonları **doğrudan** buraya yazar (innerHTML).     |
| `chatInput`     | input     | Mesaj yazma kutusu (`<input>` veya `<textarea>` olabilir). |
| `chatSendBtn`   | button    | Gönder düğmesi; `onclick="onSendBtn()"` ile bağlanır.      |

> Not: Motor `document.getElementById('btnSend').onclick = sendCurrentMessage;`
> şeklinde **zorunlu** bir bağlama yapar. Eski temalar için `STUB_IDS` listesi
> görünmez bir `#btnSend` üretir; OO temasında ise gerçek `#chatSendBtn` üzerinden
> `onSendBtn() → sendChatMsg() → sendCurrentMessage()` zinciri çalışır. Yeni
> temalarda bu zinciri **bozmayın**: kendi düğmenizin `onclick`'ini
> `onSendBtn()` ya da doğrudan `sendChatMsg()` olarak ayarlayın.

### H8.2) Mesaj akışı (P2P-only sözleşmesi)

```
Kullanıcı → chatInput → onSendBtn() / Enter
        → window.sendChatMsg()           (adapter)
        → window.sendCurrentMessage()    (engine)
        → sendSecureP2PWhenReady(target, "MSG###<id>###<text>")
        → peers[target].dc.send(...)     (WebRTC DataChannel)
```

- Özel sohbette WSS'e mesaj **düşmez**. P2P kapalıysa motor mesajı
  `state.outboundQueue`'ya alır; bağlantı açılınca otomatik gönderir.
- "Genel sohbet" (HERKES) kaldırıldı; geriye uyumluluk için kod yolu durur ama
  yeni temalarda kullanılmamalıdır.

### H8.3) Alt Nav Davranışı (ZORUNLU)

Sohbet ekranı (ve diğer tam-ekran katmanlar: `screen-ooCall`, `screen-ooIncoming`,
`screen-ayarlar`, `screen-phone`, `screen-auth`) açıldığında alt navigasyon
**gizlenmelidir**; aksi halde mesaj yazma kutusu nav'ın altında kalır.

Adapter bu işi tek noktadan yapıyor:

- `applyNavVisibility(screenId)` — `FULLSCREEN_OVERLAYS` haritasında olan
  ekranlarda `#bottom-nav`'ı `display:none` yapar; aksi halde gösterir.
- `enterMain()` — başarılı girişten sonra `#bottom-nav` üzerine
  `dataset.enabled = '1'` koyar. Bu bayrak yokken nav hiçbir koşulda
  görünmez (kayıt/login öncesi gizli kalsın).

Yeni tema kendi tam-ekran katmanını eklerse `FULLSCREEN_OVERLAYS` haritasına
o ekranın id'sini eklemek **zorundadır**.

### H8.4) Gönderim sonrası UX

- `sendChatMsg()` çağrısının ardından adapter `window.updateSendIcon()` çağırır
  (mikrofon ↔ uçak ikonu geçişi) ve `chatInput.focus()` yapar; klavye kapanmasın.
- `chatInput` boşsa gönderim yapılmaz; düğmenin görünümü `is-mic / is-send`
  sınıfları üzerinden yönetilir (CSS `.ci-send.is-send .send-arrow` ve
  `.ci-send.is-mic .send-mic`).

### H8.5) Doğrulama checklist'i (yeni tema entegre edildiğinde)

1. A ve B kişileri tanıştır (kişiyi ekle, online göründüğünü doğrula).
2. A → B sohbet aç, alt nav **gizleniyor mu**? Mesaj kutusu görünüyor mu?
3. Mesaj yaz → Enter veya gönder → balon **anında** çıkıyor mu?
4. B tarafında yeni mesaj **DataChannel** üzerinden geldi mi? (DevTools →
   Network → WS sekmesinde `MSG###` paketi GÖRÜNMEMELİ; sadece sinyal
   trafiği olmalı.)
5. A uygulamayı kapat → B'de durum anında "çevrimdışı" olmalı (H5).
6. Sohbet kapat (geri butonu) → alt nav geri **görünmeli**.

---

## 6.1) Adım 4c — Çağrı Sinyal Yan Etkileri (handleCallSignal sarmalaması)

> **Tarih:** Sonradan eklendi. İlk aşamada düzeltmeler adapter içindeki
> `window.handleCallSignal` sarmalamasıyla yapıldı; sonra güvenli olan kısımlar
> engine seviyesine taşındı. Monkey-patch artık eski/farklı engine sürümlerine
> karşı savunma katmanı olarak durur. Yeni temaların ekstra bir şey yapması gerekmez.

### 6.1.1) Düzeltilen Sorunlar

**Sorun A — Caller iptal edince callee'nin "Gelen Arama" ekranı düşmüyordu**

- Adım: A, B'yi arıyor → B'de `#screen-ooIncoming` açılıyor (çalıyor) → A
  cevap beklemekten vazgeçip `oocHangup()` basıyor → `CALL_END` P2P ile B'ye
  gidiyor.
- Eski davranış: Engine `handleCallSignal('CALL_END')` sadece
  `endActiveCall(true) + endVideoCall(true)` çağırıyordu; ama callee henüz
  kabul etmediği için `#activeCallScreen` ve `videoContainer` zaten
  kapalıydı. `#callScreen` (gelen arama stub'ı) ise **kapatılmıyordu** →
  adapter'ın `bridgeEngineIncomingToOO` MutationObserver'ı tetiklenmiyor →
  `#screen-ooIncoming` overlay'i ekranda asılı kalıyordu.
- Yeni davranış: Adapter `handleCallSignal`'i sarmaladı; `CALL_END` veya
  `CALL_REJECT` geldiği anda gelen arama overlay'i açıksa **elle**:
  - `#callScreen.classList.add('hidden')`
  - `state.incomingCallFrom = null`
  - `stopBeep()` (varsa)
  - `closeOOIncomingScreen()`

**Sorun B — Görüntülü aramada caller'da "Çalıyor…" yazısı asılı kalıyordu**

- Adım: A, B'yi görüntülü arıyor → B kabul ediyor → B'de "Bağlandı" ve 00:00
  başlıyor; A'da hâlâ "Çalıyor…" yazıyor, sayaç hareketsiz.
- Sebep: Engine sesli aramada `#activeCallScreen`'i kullanıyor ve
  `activeCallStatus = 'Bağlandı'` yazıp `startCallTimer()` tetikliyor.
  Görüntülü aramada ise sadece `videoContainer.classList.add('active')`
  oluyor; `#activeCallScreen` AÇILMIYOR. Adapter'ın
  `bridgeEngineCallToOO` polling'i bu yüzden "Bağlandı"yı göremiyordu.
- Yeni davranış: `handleCallSignal` sarmasında `CALL_ACCEPT` /
  `CALL_ACCEPT###<ts>` geldiğinde, `#screen-ooCall` açıksa şunlar **elle**
  yapılıyor:
  - `oocStatus.textContent = 'Bağlandı'`
  - `oocDuration.style.visibility = 'visible'`
  - `screen-ooCall.classList.add('connected')`
  - `stopRingbackTone()`, `ooOutgoingPending = false`,
    `ooEngineActiveSeen = true`
  - `startOOCallTimer(acceptedAt)` — engine'in damgaladığı timestamp'tan
    eşzamanlı 00:00.

### 6.1.2) Yeni Tema Eklerken Notu

Yeni bir tema yazarsan `engine.js`'e dokunma; aşağıdaki ID'leri sözleşmeye
göre koyman yeterli (zaten 6.0.5'te listelendi):

- `screen-ooCall`, `oocStatus`, `oocDuration` (caller / aktif arama)
- `screen-ooIncoming` (callee gelen arama)

Tema-özel adapter (`sohbeto-adapter-XX.js`) yazıyorsan, ana adapter'ın
`handleCallSignal` sarmasını **bozma**; sadece kendi UI yan etkilerini ekle
(ör. arayüze özel ses, vibration, animasyon). Sıralama:

```html
<script src="./sohbeto-adapter.js"></script>      <!-- önce ana adapter -->
<script src="./sohbeto-adapter-XX.js"></script>   <!-- sonra tema-özel -->
<script src="./sohbeto-engine.js"></script>       <!-- en son motor -->
```

### 6.1.3) Engine.js'e Yapılan Düzeltmeler (UYGULANDI)

Kullanıcının onayıyla `sohbeto-engine.js`'e aşağıdaki **cerrahi** eklemeler
yapıldı. Davranış kontratı değişmedi, sadece adapter köprüleri için eksik
sinyaller dolduruldu:

1. **`handleCallSignal('CALL_END')` ve `'CALL_REJECT')`** dallarına eklendi:
   ```js
   if (state.incomingCallFrom) {
     document.getElementById('callScreen').classList.add('hidden');
     state.incomingCallFrom = null; state.incomingCallType = "audio";
   }
   ```
   → Karşı taraf aramayı iptal/red ettiğinde callee'nin `#callScreen` (gelen
   arama stub'ı) anında kapanır; `bridgeEngineIncomingToOO`
   MutationObserver'ı tetiklenip OO incoming overlay'i kendiliğinden düşer.
   Eski adapter monkey-patch'i artık savunma amaçlı.

2. **`handleCallSignal('CALL_ACCEPT')`** dalı sesli/görüntülü ayrımı
   yapmadan başta `#activeCallStatus = 'Bağlandı'` yazıyor ve global
   `window.__SOHBETO_CALL_CONNECTED_AT = acceptedAt` damgalıyor. Tüm temalar
   "Bağlandı" yazısını ve doğru başlangıç zamanını **tek kaynaktan** okur.

3. **`startVideoCall(...)`** artık görüntülü aramada da `#activeCallScreen`
   stub'ını açıyor ve `#activeCallStatus` / `#activeCallName` yazıyor:
   - `isIncoming === true` → status `'Bağlandı'` (callee kabul etti, anında
     bağlı).
   - `isIncoming === false` → status `'Çalıyor…'` (caller, kabul bekliyor).
   Adapter'ın `bridgeEngineCallToOO` MutationObserver'ı görüntülü aramada
   da tetiklenir; callee tarafında OO call ekranı otomatik açılır,
   caller'da polling "Bağlandı"yı görüp 00:00'ı başlatır.

### 6.1.4) Görüntülü Aramada Bilinen Davranış Notları

- **Görsel etki yok**: Engine'in `#activeCallScreen` stub'ı iframe içinde
  offscreen tutuluyor; yukarıdaki ek sadece ID'lere yazar, OO sahnesindeki
  hiçbir piksel etkilenmez.
- **Tek kaynak status**: Yeni temalar artık sadece `#activeCallStatus`
  içeriğini izleyerek "Çalıyor…" → "Bağlandı" geçişini güvenle yakalar.
  `videoContainer.active` artık gerekli değil — sadece medya ipucu.
- **Cevapsız çağrı timeout'u kaldırıldı**: `showIncomingCall` artık 30 sn sonra
  otomatik `rejectCall()` çağırmaz. Kabul edilmemiş görüntülü çağrı, kullanıcı
  dokunmadan düşmemelidir; yalnızca `CALL_END`, `CALL_REJECT` veya gerçek bağlantı
  sonlandırma sinyaliyle kapanır.

### 6.1.5) Yeni Tema Sözleşmesi (özet)

Yeni tema yazarken engine'e dokunma. İhtiyacın olan ID kontratı:

| Engine ID (OKU) | Anlam |
|---|---|
| `#activeCallStatus` | "Çalıyor…" / "Bağlandı" — temel status string'i |
| `#activeCallName` | Karşı tarafın görünen adı |
| `#activeCallDuration` | Engine'in kendi sayacı (mm:ss) |
| `#videoContainer.active` | Görüntülü medya ipucu (opsiyonel) |
| `window.__SOHBETO_CALL_CONNECTED_AT` | Bağlanma timestamp'i (timer için) |

| Tema ID (YAZ) | Anlam |
|---|---|
| `#screen-ooIncoming` | Gelen arama overlay'i |
| `#screen-ooCall` | Aktif/giden arama overlay'i |
| `#oocStatus` / `#oocDuration` | Tema'nın gösterdiği status/sayaç |

Yükleme sırası (HTML):
```html
<script src="./sohbeto-adapter.js"></script>
<script src="./sohbeto-adapter-XX.js"></script>  <!-- tema-özel ekstra -->
<script src="./sohbeto-engine.js"></script>      <!-- en son -->
```

---

## 6.2) Adım 5 — Mesaj Kutusu (Composer) Sözleşmesi

`sohbetoOO.html` üzerinde mesaj kutusunu tamamen elden geçirdik. Yeni temalar bu yapıyı baz almalıdır.

### 6.2.1) Yapı (zorunlu DOM)

```
.chat-input-bar
 ├─ .ci-field                     ← yuvarlak alan (input + iç butonlar)
 │   ├─ button#ciPlusBtn          ← "+" : Ekle paneli toggle
 │   ├─ input#chatInput
 │   ├─ button#ciEmojiBtn         ← "😊" : Emoji paneli toggle
 │   └─ button.ci-cam             ← kamera (fa-solid fa-camera)
 └─ button#chatSendBtn            ← .is-mic / .is-send / .recording

.ci-panel.hidden#ciAttachPanel    ← Ekle paneli (Fotoğraf/Kamera/Dosya/Konum)
.ci-panel.hidden#ciEmojiPanel     ← Emoji paneli (İfadeler / Bayraklar)
  └─ #ciEmojiGrid
```

**Kural:** "+" butonu KESİNLİKLE `.ci-field` içinde olmalı. Dış flex satırına
konursa 320px altında input gözükmez. Bu en sık karşılaşılan responsive bug'dır.

### 6.2.2) Adapter API'leri

| Fonksiyon | Görev |
|---|---|
| `chatToggleAttach()` | Ekle panelini aç/kapa, input blur |
| `chatToggleEmoji()`  | Emoji panelini aç/kapa, input blur |
| `ciSwitchEmojiTab('faces'\|'flags')` | İki sekmeli emoji listesi |
| `ciClosePanels()` | Input focus alınca panelleri kapatır |
| `chatPickPhoto()` / `chatPickDoc()` / `chatPickLocation()` | Ekle paneli aksiyonları |
| `chatCamera()` | `<input type=file accept=image/* capture=environment>` |
| `onSendBtn()` | Yazı varsa metin gönder, yoksa mikrofon (basılı tut) |

Mikrofon **bas-konuş**: `pointerdown` → kayıt başlar (`#chatSendBtn.recording`
kırmızı yanıp söner), `pointerup` → kayıt durur ve `🎤 Sesli mesaj (Xs)`
metni P2P kanalı üzerinden gönderilir. **NOT:** Ses verisi şu an P2P üstünden
iletilmiyor (engine'de `sendVoice` yok). Yalnızca süre etiketi gönderilir.
Gerçek ses transferi engine.js'e küçük bir ekleme gerektirir.

### 6.2.3) Responsive Notu (320px)

`@media (max-width: 360px)` kuralı ile iç buton boyutları 32→28px,
send butonu 40→36px'e düşer. "+" `.ci-field` içinde olduğu için
input minimum genişlik almakta zorlanmaz.

### 6.2.4) Yeni Tema Geçişi

Başka temalar (kuran.html dışındaki gelecek sohbet temaları) için:
1. Yukarıdaki DOM iskeletini birebir kullan (sınıf adları farklı olabilir
   ama ID'ler — `chatInput`, `chatSendBtn`, `ciPlusBtn`, `ciEmojiBtn`,
   `ciAttachPanel`, `ciEmojiPanel`, `ciEmojiGrid` — aynı kalmalı).
2. `sohbeto-adapter.js`'in mevcut handler'ları otomatik bağlanır.
3. Görsel stili tema kendine göre değiştirebilir; mantık adapter'da.

### 6.2.5) Sesli Mesaj (P2P, gerçek ses verisi)

Artık `🎤 Sesli mesaj (Xs)` metni değil, **gerçek opus/webm ses verisi** P2P
data channel üzerinden iletilir. Akış:

1. Adapter `MediaRecorder` ile `audio/webm;codecs=opus` (24 kbps) kaydı yapar.
2. `pointerup` → blob → base64 → `window.sendVoiceMessage(targetConnId, b64, dur, mime)`.
3. Engine, payload'ı `VOICE_PART###vid###idx###total###mime###dur###chunk` paketleri
   halinde (≈6 KB) parçalayıp P2P kanalından yollar, sonunda `VOICE_END###vid`.
4. Alıcı tarafta engine parçaları birleştirir, `Blob URL` üretir ve sohbet
   balonuna `<audio controls>` olarak gömer.

**ID sözleşmesi:** Tema sadece `chatSendBtn`'i sağlamalı; render edilen bubble
`engine.js` içindeki `buildVoiceMsgEl()` tarafından `#chatMessages` konteynerine
eklenir. Ek CSS gerektirmez.

**Sınırlar (P2P stabilitesi için):**
- Maks. 25 saniye (daha uzun kayıt 25s'e kırpılır).
- Yalnızca özel sohbet (HERKES hedefine sesli mesaj gitmez).
- P2P kanalı `open` değilse engine `initP2P` çağırır ve kullanıcıya
  log düşer ("kısa süre sonra tekrar deneyin").
- Yeniden açılan eski sohbette blob URL kalıcı değildir; IDB sadece
  `🎤 Sesli mesaj (Ns)` etiketini saklar (oynatma yalnızca canlı oturumda).

### 6.2.6) Bayraklar Bölümü Sözleşmesi

Bayrak listesi **sabit ve sıralıdır** (kullanıcı talebi):
Türkiye → Doğu Türkistan → Azerbaycan → Türkmenistan →
Kazakistan → Kırgızistan → Özbekistan → KKTC → İslam ülkeleri
(Körfez → Levant → Güney/Orta Asya → Kuzey Afrika).

- Doğu Türkistan ve KKTC için Unicode flag emoji yok → adapter içinde
  inline SVG (data URI) kullanılır; grid butonuna `<img>` olarak basılır.
- Tıklanınca metin olarak `[Doğu Türkistan]` / `[KKTC]` eklenir.
- **Bu listeye onay alınmadan başka ülke EKLENMEYECEK.**
