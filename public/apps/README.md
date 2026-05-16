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

Adapter hem `getEngineState().users` haritasını hem de `peers[connId].dc.readyState`
durumunu kontrol eder. Artık sadece chat header değil, **sohbet listesi avatar noktaları**
ve **kişiler listesi çevrimiçi/çevrimdışı satırı** da aynı kaynaktan güncellenir.

Önemli mantık: Arama başlatırken DB'de saklı eski `connId`ye güvenilmez. P2P data channel
açıksa mevcut id kullanılır; açık değilse adapter numarayla **taze LOOKUP** ister ve yeni
`LOOKUP_REPLY` gelmeden aramayı kesin başlatmaz. Böylece uygulamadan çıkıp tekrar giren
kişinin bayatlayan bağlantı id'si yüzünden "çalıyor görünüyor ama karşıya ulaşmıyor" hatası
engellenir.

Tema tarafında ek zorunlu kod yoktur; `#screen-chat .chat-h-status`, sohbet listesi `.conv-avatar`
ve kişiler listesi `#contactsList` adapter tarafından işlenir.

### H5) Uygulama Kapanışı — Çevrimdışı Bildirimi

> Önceden, kullanıcı sekmeyi/PWA'yı kapatınca karşı taraf bunu sadece WebSocket
> sunucusu sezdiğinde (genelde 30+ sn sonra) görürdü. Adapter artık `pagehide`
> ve `beforeunload` olaylarında:
>
> 1. Aktif aramayı `endActiveCall()` ile sonlandırır (CALL_END P2P sinyali yollar).
> 2. Her açık P2P data channel'a önce `PRESENCE_OFFLINE###timestamp` gönderir.
> 3. Tüm `peers[*]` data channel'larını ve peer connection'larını **düzgünce kapatır**.
>    → Karşı tarafta adapter bu presence paketini veya `dc.onclose` olayını yakalar,
>    ilgili `connId`yi `state.users` içinden siler ve kişiler/sohbet listelerini
>    **anında çevrimdışı** olarak yeniden çizer.
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

### H7.1) GüneşOS Tam Ekran Bildirimi ↔ Sohbeto İç Arama Ekranı Senkronu

Gelen çağrıda **iki ekran aynı çağrıyı temsil eder**:

1. GüneşOS parent overlay'i (`IncomingCallOverlay`) — kullanıcı başka uygulamadayken görünür.
2. Sohbeto tema içi gelen çağrı ekranı (`#screen-ooIncoming`) — uygulama açıldığında görünür.

Kural: Parent overlay'de "Cevapla" basılınca Sohbeto iframe'i **unmount/display:none yapılmış
olmamalı**. Pencere arka plan servisi olarak açık kalırken iframe 1×1 offscreen tutulur;
böylece `postMessage({ type: 'sohbeto:remote-accept', from })` doğrudan canlı engine'e gider.

Zorunlu protokol:

| Yön | Mesaj | Görev |
| --- | ----- | ----- |
| engine → parent | `sohbeto:incoming-call` | OS tam ekran çağrı overlay'ini açar |
| parent → engine | `sohbeto:remote-accept` | `acceptCall()` çağırır; gerekirse `from` ile yanlış çağrı engellenir |
| parent → engine | `sohbeto:remote-reject` | `rejectCall()` çağırır |
| engine → parent | `sohbeto:call-accepted` | OS overlay'ini kapatır; Sohbeto iç arama ekranı açık kalır |
| engine → parent | `sohbeto:incoming-call-cancelled` | Arayan kapattı/reddedildi; OS overlay'i kapanır |

Önemli: `WindowFrame` mobil modda background Sohbeto'yu `display:none` ile saklamaz;
1×1 offscreen tutar. `display:none` kullanılırsa bazı tarayıcılarda iframe olay döngüsü
askıya alınır, parent kabul mesajı gecikir/kaçabilir ve arayan tarafta "çalıyor" takılı kalır.

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

- Doğu Türkistan ve KKTC için Unicode flag emoji yok.
  - **KKTC** → adapter içinde inline SVG (data URI) `<img>` olarak basılır,
    tıklanınca `[KKTC]` metni eklenir.
  - **Doğu Türkistan** → `public/apps/flag-dogu-turkistan.png` dosyası
    (gerçek bayrak görseli) emoji boyutunda (22×22 px, `border-radius:3px`)
    grid butonuna `<img>` olarak yerleştirilir. Tıklanınca metin yerine
    **☪ (U+262A Star and Crescent)** emoji'si chat input'a eklenir —
    böylece "Doğu Türkistan" yazısı yerine bir bayrak/emoji gönderilir.
  - Yeni bayrak görseli eklemek için: PNG/SVG dosyasını `public/apps/`
    altına koy → `sohbeto-adapter.js` → `EMOJI_FLAGS` dizisine
    `{ img: 'dosya-adi.png', t: 'Ülke Adı' }` olarak ekle. Render kodu
    aynı boyutta basacaktır; tıklama davranışı için aynı bloğa özel
    `b.onclick` yaz (örn. `ciInsertEmoji('☪')`).
- Tıklanınca KKTC için `[KKTC]` metni; Doğu Türkistan için `☪` emoji'si eklenir.
- **Bu listeye onay alınmadan başka ülke EKLENMEYECEK.**

---

## EK NOTLAR — Yeni Tema / Arayüz Akış Listesi (Adapter Köprüleme Rehberi)

> Bu bölüm yeni bir tema (`sohbetoXX.html`) eklerken adapter'ın **hangi
> noktalardan dokunduğunu** görsel olarak takip edebilmen için yazıldı.
> Her madde, motor tarafından beklenen DOM/global ile temanın karşılığı
> arasındaki köprüyü gösterir. Yeni tema yazarken bu listeyi tek tek geçtiysen
> motor seninle konuşur.

### Akış Haritası (özet)

```
┌──────────────────────────┐      ┌────────────────────────────┐
│ TEMA HTML (sohbetoXX)    │ <==> │ sohbeto-adapter.js (köprü) │
└──────────────────────────┘      └─────────────┬──────────────┘
                                                │
                                                ▼
                                  ┌────────────────────────────┐
                                  │ STUB DOM (offscreen)       │
                                  │ #convListOzel #topbarTitle │
                                  │ #fileInput   #callScreen…  │
                                  └─────────────┬──────────────┘
                                                ▼
                                  ┌────────────────────────────┐
                                  │ sohbeto-engine.js (MOTOR)  │
                                  └────────────────────────────┘
```

### Akış 1 — Giriş / OTP
- Tema: `#phoneInput`, `#codeInputs .code-input` (×6), `app.sendCode()`, `app.verifyCode()`.
- Adapter: `+90` otomatik prefix (`__normalizePhone`); flow seçimi (`welcome` / `login`); OTP'yi motorun `welcomeCode` / `loginCode` stub'larına bas.

### Akış 2 — Profil (Ayarlar)
- Tema: `#profilePicCircle`, `#profilePicInput` (`onchange="handleProfilePic(event)"`), `#profileName`, `#profileBio`.
- Adapter:
  - `handleProfilePic(ev)` → dosyayı motor stub'ı `#fileInput`'a forward eder (resize + IndexedDB + P2P broadcast).
  - Görsel optimistic preview anında `#profilePicCircle` içine `<img>` olarak basılır.
  - `profileName` / `profileBio` `localStorage["sohbeto.oo.profile"]` üzerinde kalıcı; her input'ta `state.nick` / `state.bio` motor state'ine yansıtılır.
  - **Default "Kullanıcı" YOKtur** — kullanıcı boş başlar; rehberde adı yazmadığı kişiler için **telefon numarası** display name olur (`resolveDisplayName`).

### Akış 3 — Sohbet Listesi
- Tema: `#screen-sohbetler .content-area` (boş container).
- Adapter: `renderConvList` monkey-patch → motor stub'ı `#convListOzel`'i okur, `resolveDisplayName(connId, raw)` ile isimlendirir, `[xxx]` taglarını söker, aynı kişi için tek kart bırakır (dedup), her satıra `data-conn-id` koyar. Tıklamada `openChat(connId)`.

### Akış 4 — Sohbet Ekranı
- Tema: `#chatHName`, `#chatHAvatar`, `#chatMessages`, `#chatInput`, `#chatSendBtn`, `closeChat()`, `onSendBtn()`.
- Adapter: `openChat` patch → `chatHName` `resolveDisplayName` ile dolar; `chatHAvatar` motor `#topbarAvatar` HTML'inden klonlanır; **klavye tetiklenmez** (`ci.blur()` + scroll en alta `auto`).

### Akış 5 — Kişiler
- Tema: `#contactsList`, `#contactsEmpty`, `#contactSearch`, `#addContactSheet` + `#newContactName` / `#newContactPhone`, `openAddContact()` / `closeAddContact()` / `saveContact()`.
- Adapter:
  - `+90 ` otomatik prefix (`__normalizePhone`) — açılışta ve focus'ta inputa düşer.
  - **İsim opsiyoneldir** — boş bırakılırsa kişi telefon numarasıyla kaydedilir; rehberde aramada da numara olarak görünür.
  - Motor `saveNewContact()` çağrılır; numara `#newContactNumber` stub'ına forward edilir.

### Akış 6 — Kişi Kartı Overlay
- Tema: `#contactCardOverlay`, `#ccAvatar`, `#ccName`, `#ccPhone`, `ccCall()`, `ccVideo()`, `ccOpenChat()`, `closeContactCard(ev)`.
- Adapter: liste satırının `data-name|number|connid` attr'larından doldurur; arama butonları `connId` yoksa önce `openContactByNumber` ile lookup atar.

### Akış 7 — Arama (Sesli/Görüntülü)
- Tema: `#screen-ooCall`, `#screen-ooIncoming`, video sahne (`.ooc-video-stage`, `#oocVideoLocal`, `#oocVideoRemote`).
- Adapter: `MutationObserver` motor `#activeCallScreen` / `#callScreen` / `#videoContainer` `.hidden`/`.active` sınıflarını izler, OO ekranlarını otomatik açar/kapar, video node'larını fiziksel olarak sahne içine taşır.

### Akış 8 — Alt Navigasyon + Swipe
- Tema: `#bottom-nav` ve `#nav-{sohbetler|kisiler|gruplar|ayarlar}` butonlarında `app.navigate('...')`.
- Adapter: `.app-container` üzerinde touch swipe → `sohbetler ↔ kisiler ↔ gruplar ↔ ayarlar` (chat / call / input alanlarında bloklu).

### Akış 9 — Telefon Normalizasyonu (Genel)
- Adapter `window.__normalizePhone(raw)` her tema tarafından kullanılabilir:
  - Boş → `'+90 '`
  - `+` ile başlıyorsa dokunulmaz (yabancı ülke kodu).
  - Aksi halde başındaki `0` ve `90` temizlenir, başına `+90 ` eklenir.

### Yeni tema check-list (kopyala, doldur)
- [ ] Tüm ekran ID'leri (Akış 3–8) tema HTML'inde mevcut.
- [ ] `<head>` sırası: önce `sohbeto-adapter.js`, sonra `sohbeto-engine.js`.
- [ ] Profil bölümünde `id="profilePicCircle"`, `id="profileName"`, `id="profileBio"` ve `<input id="profilePicInput" onchange="handleProfilePic(event)">`.
- [ ] Telefon inputlarında **default değer yok** (adapter `+90 ` koyar).
- [ ] "Kullanıcı" gibi sahte default yok — adapter persistans yönetiyor.
- [ ] Gelen arama (`#screen-ooIncoming`) ve görüntülü sahne (`.ooc-video-stage`) eklendi (yoksa arama görünmez).

---

## DEĞİŞİKLİK GÜNLÜĞÜ (chronological)

### v? — Mesaj balonları + sohbet listesi temizliği
- Mesaj balonlarında `Adı>p2p` / `Sen>p2p` etiketleri **gizlendi** (`.msg-sender`, `.msg-tag` → `display:none`).
- Sohbet kartları, kişi avatarı ve chat header avatarındaki **emoji boyutları** sınırlandı.
- `[xxx]` tag'i hiçbir yerde görünmüyor (renderConvList, conv-preview, chat header).
- Aynı kişi için **çoklu sohbet kutusu** dedup'lanır (display-name lowercase key).

### v? — Klavye + Swipe
- Sohbet açılırken **klavye tetiklenmez** (`ci.blur()`, scroll en alta `behavior:auto`).
- `.app-container` üzerinde **touch swipe** ile alt sekmeler arası geçiş.

### v? (BU SÜRÜM) — Profil + Telefon + Anonim kişi
- `handleProfilePic` global'i adapter'a eklendi → galeriden seçilen foto **anında** `#profilePicCircle` içinde görünür ve motora forward edilir (resize + IndexedDB + P2P broadcast).
- `profileName` / `profileBio` `localStorage["sohbeto.oo.profile"]` üzerinde kalıcı; motor `state.nick` / `state.bio`'ya yansıtılır.
- **"Kullanıcı"** default değeri kaldırıldı; kullanıcı boş başlar.
- Telefon inputlarında (`#phoneInput`, `#newContactPhone`) `+90 ` **otomatik prefix** (`__normalizePhone`).
- Kişi kayıt ekranında **isim opsiyoneldir** — boş bırakılırsa numara kişi adı olarak kaydedilir; rehberde **numara olarak görünür**.
- `openChat` artık `chatHName`'i `resolveDisplayName` üzerinden çözüyor (rehber > temiz nick > numara).

> **Motor değişmedi.** Tüm bu davranışlar `sohbetoOO.html` + `sohbeto-adapter.js` üzerinde yapıldı.

### v? (BU SÜRÜM) — Avatar/kart vs sohbet ayrımı + canlı profil yayını + chatNext + "Kullanıcı" lekesi
- **Sohbet listesinde tıklama akışı netleşti:**
  - Satır gövdesine tıklama → `openChat(connId)` (sohbeti açar).
  - Sadece **profil avatarına** tıklama → `showContactCard(connId)` (kişi/ileride grup kartı). Kişi rehberde olsa da olmasa da çalışır.
- `chatNext()` artık çalışıyor — chat header'daki "›" butonu `state.conversations` içindeki bir sonraki private sohbete döner (round-robin).
- **"Kullanıcı" lekesi kaldırıldı:**
  - Engine `createProfileUpdatePacket()`'ta `state.nick` boşsa artık `'Kullanıcı'` göndermiyor → boş gönderiyor (alıcı resolveDisplayName ile numaraya/rehbere düşer). _(motor küçük dokunuş: payload fallback)_
  - Adapter `resolveDisplayName` legacy `'Kullanıcı'` literalini de boş kabul edip numaraya düşer.
  - Profil ayarlarında ad alanı boşsa `state.nick` `''` yapılır (engine init'inde set edilen `'Kullanıcı'` üzerine yazılır).
- **Anında P2P profil yayını:** Profil fotoğrafı / ad / bio her değişikliğinde `scheduleProfileBroadcast()` tetiklenir → karşıdaki kişi **kişiler veya sohbetler ekranındayken bile** yeni profili anında alır (50ms foto için, 400ms metin için debounce).

> **Motor dokunuşu (tek satır):** `createProfileUpdatePacket` payload'ında `'Kullanıcı'` fallback'i kaldırıldı. Akış şu: kullanıcı kendini adlandırmamışsa, paketteki `name` boş gönderilir; alıcı tarafta `resolveDisplayName` numarayı/rehber adını gösterir.

### v? (BU SÜRÜM) — Arayan kimliği + kişi kartı + `>` + tema ayarları
- **Arayan kişi metni temizlendi:** `P2P` artık kullanıcıya isim olarak düşmüyor; mümkünse rehber adı, değilse kayıtlı telefon numarası gösteriliyor.
- **Sohbet avatarı → kişi kartı:** Sohbet listesindeki avatar ve chat header avatarı artık OO kişi kartını açıyor; kart motor overlay'ine değil tema overlay'ine bağlandı.
- **Kişiler ekranı tıklama akışı:** Satır gövdesi → sohbet aç, sadece avatar → kişi kartı aç. Bu davranış rehberde tutarlı hale getirildi.
- **`chatNext()` genişletildi:** Aktif private sohbet yoksa veya tek sohbet varsa rehberdeki bir sonraki kişiye düşebiliyor; `>` butonu boşa düşmüyor.
- **Tema ayarları aktifleştirildi:** `app.openThemeSettings()` / `app.closeThemeSettings()` bağlandı; vurgu ve arka plan paletleri çalışıyor, seçim `localStorage["sohbeto.oo.theme"]` içinde kalıyor ve `#current-theme-name` anında güncelleniyor.

> **Motor dokunuşu:** `getDisplayName()` içinde `P2P` literal'i temizlenip rehber adı / numara fallback zinciri güçlendirildi. Ayrıca signaling sırasında `state.users` içine çıplak `P2P` yazılması engellendi.

---

## 5) Adım 5 — Akışkan Tab Geçişleri & Parmak Swipe (Telegram benzeri)

> **Yeni dosya:** `sohbeto-fluid-tabs.js`. Motora **dokunmaz**, ana adapter'ı
> kirletmez. Sadece 4 ana sekme arasında (Sohbetler ↔ Kişiler ↔ Gruplar ↔ Ayarlar)
> yönlü kayma ve dokunmatik swipe ekler.

### Yükleme sırası
```html
<script src="./sohbeto-adapter.js"></script>
<script src="./sohbeto-engine.js"></script>
<!-- Adım 5 — fluid katmanı, en sonda yüklenir -->
<script src="./sohbeto-fluid-tabs.js"></script>
```

### Davranış
- `app.navigate('kisiler')` çağrısı bir **tab → tab** geçişiyse, hidden/active
  sınıfları ile değil **`translateX(±100%)`** ile yapılır. Süre `260ms`,
  easing `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Tab dışına çıkış (chat, ooCall, ayarlar derinine) olduğunda fluid mode
  otomatik kapanır ve orijinal `app.navigate` (ana adapter) çalışır.
- **Parmak / fare swipe**: `.app-container` üzerinde yatay sürükleme; %18
  veya hızlı flick (>0.45 px/ms) komşu sekmeye geçirir; uçlarda %35 elastik
  direnç. Yatay/dikey karar eşiği `|dx| > |dy|*1.4`. Input/textarea/button/
  contenteditable veya yatay scroll içeren elementlerin üzerinde başlatılan
  drag yutulmaz.

### Yeni tema eklerken
- 4 ana sekme ekranının ID'leri **aynı kalmalı**:
  `#screen-sohbetler`, `#screen-kisiler`, `#screen-gruplar`, `#screen-ayarlar`.
- Alt-nav butonlarının ID şeması `#nav-{sohbetler|kisiler|gruplar|ayarlar}`
  korunmalı; fluid katmanı aktif tab'ı buradan da takip eder.
- Tab sırasını değiştirmek istersen `sohbeto-fluid-tabs.js` içindeki `TABS`
  dizisini güncelle (aynı sıra HTML'deki nav sırasıyla eşleşmeli).
- Tema-spesifik özel davranışın varsa **bu dosyayı düzenleme** —
  `sohbeto-fluid-tabs-XX.js` olarak kendi override'ını yaz ve fluid'den sonra yükle.

### Motor değişikliği
- **Yok.** `engine.js` tek satır bile değişmedi. Tab grubu DOM'a hep mount
  kaldığı için `renderConvList`, `renderContacts` gibi motor render
  fonksiyonları hedef ekran şu an görünür olmasa bile çalışmaya devam eder
  (sadece `transform`'la kayar).

---

## Adım 6 — Doğu Türkistan Bayrağı + Boş Sekmeler + Mesaj Kutusu

### Doğu Türkistan bayrağı (gerçek görsel)
- **Yeni dosya:** `public/apps/flag-dogu-turkistan.png` — gerçek bayrak.
- `sohbeto-adapter.js` içindeki `FLAG_DOGU_TURKISTAN` artık inline SVG
  yerine bu PNG'ye işaret eder.
- Emoji panelinde Türkiye 🇹🇷'den hemen sonra **22×22 px** bir bayrak
  butonu olarak görünür (Unicode emoji boyutuyla aynı).
- Tıklanınca chat input'a **`☪`** (U+262A Star and Crescent) emoji'si
  yazılır — düz `<input>` olduğundan inline `<img>` eklenemez; bu emoji
  bayrağı temsil eden tek karakterlik en yakın Unicode karşılığıdır.
- Yeni özel bayrak eklemek için: PNG/SVG'yi `public/apps/` altına koy,
  `EMOJI_FLAGS` dizisinde sıraya `{ img: 'dosya.png', t: 'Ad' }` ekle,
  istersen tıklama davranışı için `b.onclick = function(){ ciInsertEmoji('…'); }`
  bloğunu özelleştir.

### Kişiler & Gruplar boş ekranları (sadeleştirme)
- **Kişiler boş** (`#contactsEmpty`): "Henüz kişi yok" başlığı ve
  yardım metni kaldırıldı → **sadece simge + `Kişi Ekle` butonu**.
  `+` ikonu üstte sağdaki header'da kalmaya devam ediyor.
- **Gruplar boş**: başlık, paragraf ve "Gruba Katıl" linki kaldırıldı →
  **sadece simge + `Grup Oluştur` butonu**.
- `.empty-state` `height: 60%` yerine `height: 100%` oldu →
  içerik tam dikey ortalanır (önceki sürümdeki "simge yukarı kayma"
  düzeltildi).

### Chat mesaj kutusu — biraz yukarı
- `.chat-input-bar` alt padding'i:
  `max(8px, env(safe-area-inset-bottom))` → `max(20px, calc(env(safe-area-inset-bottom) + 12px))`.
- Sonuç: input bar telefon altına yapışık durmuyor, ~12 px yukarı taşındı.
  Sol/sağ değerleri (padding 8 px ve `.ci-field` `border-radius:22px`) korundu.

### Motor değişikliği
- **Yok.** Tüm değişiklikler tema (`sohbetoOO.html`) ve adapter
  (`sohbeto-adapter.js`) katmanında yapıldı.

---

## Adım 7 — Doğu Türkistan / KKTC bayraklarını gerçek görsel olarak gönderme

### Sorun
- Tıklayınca mesaja `☪` (U+262A) ekleniyordu; bu karakter Apple/Twemoji
  fontlarında **mor** renklenir ve gönderilen Doğu Türkistan PNG'siyle hiç
  alakası yoktur.
- "Profil fotoğrafı oldu" izlenimi: aslında engine avatarı `peerProfile.image`
  veya `emoji`'den çiziyor; mor ☪ + sol tarafta küçük yuvarlak avatar alanı
  görsel olarak karışıklık yaratıyordu.

### Çözüm (sohbeto-adapter.js)
1. **Token gönderme:** Bayrak emoji panelinde Doğu Türkistan'a tıklayınca
   `:dt-flag:`, KKTC'ye tıklayınca `:kktc-flag:` sentinel metin token'ı
   eklenir (`ciInsertEmoji(token)`).
2. **Render değiştirici:** `setupFlagTokenReplacer()` IIFE'si bir
   MutationObserver ile `#chatMessages .msg-bubble` ve `.conv-preview`
   altındaki yeni text node'ları izler; içindeki token'ları gerçek
   `<img>` etiketine çevirir (`1.15em × 1.15em`, `vertical-align:-0.2em`,
   `border-radius:2px`). Hem gönderen hem alıcı tarafta gerçek bayrak
   görünür çünkü token mesajın gövdesinde ağ üzerinden taşınır.
3. **Input alanına dokunulmaz:** `INPUT`/`TEXTAREA`/`SCRIPT`/`STYLE` walk
   sırasında atlanır — kullanıcı token'ı silebilsin diye.

### Yeni bayrak / özel görsel ekleme rehberi
1. Görseli `public/apps/` altına koy (örn: `flag-yeni.png`).
2. `EMOJI_FLAGS` dizisine ekle: `{ img: 'flag-yeni.png', t: 'Ülke Adı' }`.
3. `setupFlagTokenReplacer` içinde yeni token sabiti tanımla
   (`var FLAG_X_SRC = 'flag-yeni.png';`) ve `TOKEN_RE` ile `replaceInTextNode`
   içindeki `.replace()` zincirine `:x-flag:` token'ını ekle.
4. `ciRenderEmojis` içindeki `var token = (item.t === ...)` koşuluna
   yeni `t` etiketini bağla.

### Motor değişikliği
- **Yok.** Engine `escapeHtml(text)` kullanmaya devam ediyor; tüm
  görselleştirme adapter katmanında yapılıyor. Engine'e dokunmadık.

---

## J) Fluid Tabs — Sekmeler arası akışkan geçiş (`sohbeto-fluid-tabs.js` v3)

**Amaç:** 4 ana sekme (`sohbetler` / `kisiler` / `gruplar` / `ayarlar`)
arasında Telegram benzeri akışkan parmak swipe + alt nav tıkla geçişi.
Motoru ve adapter'ı **kirletmez**; tamamen UI katmanında çalışır.

### Yükleme sırası
```html
<script src="./sohbeto-adapter.js"></script>
<script src="./sohbeto-engine.js"></script>
<script src="./sohbeto-fluid-tabs.js"></script>   <!-- en son -->
```

### v2'de neyi neden değiştirdik (önceki "duvara tosluyor" sorununun kökü)

| Sorun (v1)                                                               | Çözüm (v2)                                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `touch-action` yok → tarayıcı parmağı önce kendi scroll'una alıyor       | `.app-container.fluid-mode { touch-action: pan-y }` — yatay kontrolü biz alırız, dikey kalır     |
| Pointer capture yok → parmak konteyner dışına çıkınca event'ler düşüyor  | Yatay kilitlenince `setPointerCapture(pointerId)` — parmak nereye giderse gitsin takip ederiz   |
| `DECIDE_RATIO = 1.4` çok katı → küçük dikey titremede yatay açılmıyor    | `1.05` — yatay niyet daha hızlı algılanıyor                                                      |
| `SWIPE_DISTANCE_RATIO = 0.18` ve `VELOCITY = 0.45` → flick'ler yutuluyor | `0.14` ve `0.35` — daha hassas flick                                                             |
| Drag `px`, snap `%` → birim değişimi sıçrama hissi veriyor               | Hep `px` cinsinden `translate3d` — tutarlı                                                        |
| `requestAnimationFrame` yok → her pointermove'da style yazımı (jank)     | Tek bir `rAF` batch — 60/120fps'de düzgün                                                         |
| Pasif sekme statik → "dinamik" his yok                                   | Pasif sekmeye uzaklığa göre `scale(0.96)` + `opacity(0.55)` interpolasyonu — Telegram tadı       |
| `transition` ID seçicisi vs `.screen` class çatışması                    | ID seçicilerle `transition` tanımlandı, `.fluid-dragging` sırasında `transition:none !important` |

### Davranış kuralları
- **Yatay swipe** sadece 4 ana sekme arasında. Tam ekran katmanlara
  (`screen-chat`, `screen-ooCall`, `screen-ooIncoming`, vb.) geçişte
  `leaveFluidMode()` çağrılır → orijinal `app.navigate` davranışına döner.
- **Input/textarea/select/contenteditable** üstünde swipe **başlamaz**
  (yazı yazarken kazara sekme değişmesin).
- **İçinde yatay scroll edebilen** bir alt element üstündeysek (örn.
  story carousel) swipe başlamaz — onun scroll'una müdahale etmeyiz.
- **Kenar elastik direnç** (`DRAG_RUBBER = 0.32`): ilk/son sekmede dışa
  doğru sürüklerken hareket sönümlenir, snap geri toparlar.
- **Flick algılama** (`SWIPE_VELOCITY = 0.35` px/ms): kısa hızlı parmak
  hareketi mesafe eşiğini geçmese de sekme atlar.

### Yeni tema eklerken yapılacaklar
1. 4 ana sekme `.app-container > .screen#screen-{tab}` olarak var olsun.
2. Alt nav `#bottom-nav` içinde `.nav-item#nav-{tab}` ID'leri olsun;
   adapter `data-enabled="1"` set ettiğinde fluid mode otomatik devreye girer.
3. `.app-container` `position:relative; overflow:hidden` kalsın
   (zaten OO'da öyle).
4. Sekme içindeki **yatay scroll** alanlarına dokunma — fluid-tabs
   onu otomatik algılar ve swipe'ı pas geçer.

### Engine değişikliği
- **Yok.** Tüm mantık fluid-tabs.js içinde; `app.navigate` köprüsü
  monkey-patch ile sarmalanır, orijinal davranış korunur.

### v2.1 — Telegram benzeri "doğal" his ayarı
Önceki sürüm parmağı çok agresif takip ediyor, scale+opacity efektleriyle
sayfayı "zorla değiştirmeye çalışıyor" gibi hissettiriyordu. Yeni değerler
Telegram'ın varsayılanlarına yakın orta yol:

| Param | Eski | Yeni | Neden |
|---|---|---|---|
| `DURATION_MS` | 280 | **220** | Snap kısa & keskin (Telegram ~200-240ms) |
| `EASING` | quart-out | **easeOutCubic** `(0.33,1,0.68,1)` | Daha doğal yavaşlama |
| `SWIPE_DISTANCE_RATIO` | 0.14 | **0.30** | %30 — kazara geçişi engeller |
| `DECIDE_RATIO` | 1.05 | **1.0** | Yatay/dikey kararı simetrik (Telegram gibi) |
| `TAP_HORIZ_THRESHOLD` | 6 | **4** | Parmak hareketini daha erken yakala |
| `DRAG_RUBBER` | 0.32 | **0.50** | Uçlarda yarım direnç — duvar hissi yok |
| `INACTIVE_SCALE` | 0.96 | **1.0** | Ölçek değişimi kaldırıldı |
| `INACTIVE_OPACITY` | 0.55 | **1.0** | Opaklık değişimi kaldırıldı |

Sonuç: parmak 1:1 sayfayı taşır, %30'u geçince veya hızlı flick'te snap olur,
aksi halde geri toparlanır. Hiçbir scale/opacity efekti yok — saf yatay kayma.

### v3 — Mantık düzeltmesi: gerçek pager, eşik tabanlı eski swipe değil

Şikâyetin kökü süre (`220ms`) değilmiş; asıl sorun iki farklı swipe sisteminin
aynı anda devrede olmasıydı:

1. `sohbeto-fluid-tabs.js` parmakla ekranı taşımaya çalışıyordu.
2. `sohbeto-adapter.js` içindeki eski fallback ise sadece `touchend` anında
   `60px` geçti mi diye bakıp sekmeyi **sonradan** değiştiriyordu.

Bu iki mantık beraber çalışınca kullanıcı hafif çektiğinde ekran parmağa hemen
gelmiyor, bırakınca “zorla sekme değiştiriyor” gibi hissediyordu.

v3'te yapılanlar:

| Alan | Yeni davranış | Neden |
|---|---|---|
| Parmak takibi | `LOCK_START_PX = 2` | 2px yatay niyette sayfa hemen parmağın altına gelir |
| Dikey tolerans | `HORIZONTAL_BIAS = 0.72`, `VERTICAL_BIAS = 1.25` | Parmağın doğal dikey titremesini affeder, ama gerçek dikey scroll'u bozmaz |
| Snap eşiği | `SWIPE_DISTANCE_RATIO = 0.24` | Hafif çekiş takip eder; yaklaşık %24 üstü sekme değiştirir |
| Flick | `SWIPE_VELOCITY = 0.22` | Kısa hızlı hareketleri kaçırmaz |
| Animasyon | `DURATION_MS = 240` | Sadece bırakınca toparlamayı etkiler; parmak takibi anlık/1:1'dir |
| Pasif ekranlar | `hidden-screen` sınıfı korunur, CSS ile fluid içinde görünür çizilir | Adapter'ın görünür ekran tespit sözleşmesi bozulmaz |
| Eski adapter swipe | Fluid mode açıksa adapter fallback swipe çalışmaz | İki swipe sistemi kavga etmez |

**Önemli:** `engine.js` yine değişmedi. `adapter.js` içinde sadece eski fallback
swipe'ın fluid mode aktifken devre dışı kalması sağlandı; çünkü bu fallback,
akışkan pager'ın yerini almamalı, sadece fluid dosyası yoksa yedek kalmalı.

---

## 7) Adım 6 — Hesap Ekranı, Anında Tab Geçişi, Auto-Translate Kilidi (2026-05-16)

Bu turda **arayüz/UX** odaklı 3 değişiklik yapıldı. Motor (`sohbeto-engine.js`) yine
değişmedi. Yeni tema açarken bu sözleşmelere uy:

### 7.1) Ayarlar > Hesap > Profil ayrımı

Önceden Ayarlar ekranının başında bulunan **Ad** ve **Biyografi** alanları artık
**Hesap > Profil** (overlay `#screen-hesap`) ekranına taşındı. **Fotoğraf seçimi
(`.profile-block` + `#profilePicCircle` + `#profilePicInput`)** Ayarlar girişinde,
hemen başta kalmaya devam ediyor (kullanıcı hızlı erişebilsin).

| Eleman                       | Yer                  | Görev                                                         |
| ---------------------------- | -------------------- | ------------------------------------------------------------- |
| `.profile-block`             | `#screen-ayarlar`    | Avatar + "Değiştirmek için tıklayın" — değişmedi              |
| `#screen-hesap`              | Yeni overlay (z:15)  | `theme-header` benzeri geri butonlu tam ekran                 |
| `#profileName`               | `#screen-hesap` içi  | Ad input (ID korundu → adapter persistansı bozulmaz)          |
| `#profileBio`                | `#screen-hesap` içi  | Biyografi textarea (ID korundu)                               |
| `app.openAccount()`          | adapter              | `showScreen('screen-hesap')`                                  |
| `app.closeAccount()`         | adapter              | `showScreen('screen-ayarlar')`                                |
| `FULLSCREEN_OVERLAYS`        | adapter              | `screen-hesap` ve `screen-tema` eklendi → alt nav gizlenir    |

> **Yeni tema eklerken:** Aynı yapıyı kur — fotoğraf ayarlar girişinde,
> Ad/Biyografi alt overlay'de. `#profileName` ve `#profileBio` ID'lerini
> **mutlaka koru**; adapter `localStorage.sohbeto.oo.profile` üzerinden
> bunları senkronize ediyor, ID değişirse persistance kırılır.

### 7.2) Alt nav tıklamasında anında (animasyonsuz) geçiş

`sohbeto-fluid-tabs.js` artık `app.navigate(tab)` çağrıldığında `setActiveByIndex(idx, false)`
ile **animasyonsuz snap** uygular: tek frame boyunca `.fluid-instant` sınıfı
container'a eklenir, `transition:none` devreye girer, sonra geri kaldırılır.

- **Tap (alt nav):** animasyon yok → sohbetlerden ayarlara basınca sayfa direkt yansır.
- **Swipe (parmak):** eski akıcı 240ms `easeOutCubic` davranışı korundu.

CSS hook'u: `.app-container.fluid-instant .screen-* { transition:none !important; }`.

> **Yeni tema eklerken:** Ek bir şey yapmana gerek yok. Sadece sekme container'ı
> `.app-container` ve sekme id'leri `screen-sohbetler/kisiler/gruplar/ayarlar`
> olduğu sürece otomatik çalışır.

### 7.3) Auto-translate kilidi (Türkçe arayüz Türkçe kalsın)

Telefonlarda (özellikle Chrome / Samsung Internet) sayfa otomatik İngilizceye
çevrilince "Mehmet" → "Mahmet" gibi isimler bozuluyordu. Çözüm: **çevirmen
katmanını kapat**.

Eklenenler:

```html
<html lang="tr" translate="no">
<head>
  <meta name="google" content="notranslate">
  <meta http-equiv="Content-Language" content="tr">
```

Uygulananlar:
- `index.html` (GüneşOS shell)
- `public/apps/sohbetoOO.html`
- `public/apps/kuran.html`

> **Yeni tema/uygulama eklerken (public/apps/*.html):** Bu üç satırı **mutlaka**
> head'in en başına koy. Aksi halde Chrome dil tespitiyle çevirir, isim/numara/UI
> metinleri bozulur.


---

## 8) GünesOS ↔ Sohbeto Bildirim Köprüsü (P2P)

Sohbeto iframe içinde çalışıyor; kullanıcı Kuran, Oyunlar gibi başka bir
GünesOS uygulamasındayken Sohbeto'ya gelen mesaj/aramaları **kaçırmasın**
diye motor iki yeni `postMessage` olayı yayınlar:

```js
// Yeni gelen mesaj (P2P veya WSS):
window.parent.postMessage({
  type: 'sohbeto:incoming-msg',
  from: senderConnId,          // benzersiz peer id
  name: 'Görünür İsim',        // [numara] kırpılmış
  text: 'mesaj içeriği',       // max 240 char
  isPrivate: true
}, '*');

// Gelen arama (sesli/görüntülü):
window.parent.postMessage({
  type: 'sohbeto:incoming-call',
  from: senderConnId,
  name: 'Görünür İsim',
  callType: 'audio' | 'video'
}, '*');
```

**Köprü konumu (motor):**
- `sohbeto-engine.js → renderIncomingMsg()` sonunda mesaj köprüsü
- `sohbeto-engine.js → showIncomingCall()` sonunda arama köprüsü

**Parent tarafta (`src/components/GunesOS.tsx`):**
- `sohbetoFocusedRef` ile Sohbeto penceresinin açık + aktif olup olmadığı
  takip edilir.
- Sohbeto **odaktayken** köprü mesajları **yutulur** (duplicate engellenir;
  kullanıcı zaten in-app beep + balonu görüyor).
- Aksi halde `pushSystemMessage` ile Mesajlar uygulamasına `sohbeto-peer-<connId>`
  thread'ine düşer + sonner toast tetiklenir. Arama bildirimi 10 sn görünür.

> **Önemli — engine.js'i değiştirirken bozma:** Profil avatarı sadece
> `PROFILE_UPDATE` paketindeki `image` (data:image/...) veya `emoji` alanından
> üretilir (`getAvatarContent` / `renderProfileAvatar`). Mesaj metnindeki emoji
> **asla** avatara yazılmaz — `sanitizeProfileImage` data URL şartı koyar,
> `applyPeerProfileUpdate` yalnız PROFILE_UPDATE handler'ından çağrılır.
> Yeni özellik eklerken bu iki fonksiyona dokunma; aksi halde "gönderdiğim
> emoji profil fotoğrafı oldu" tarzı regresyonlar olur.

> **Tek sohbet kutusu garantisi:** Konuşma listesi `state.conversations` Map'i
> (key = `connId`) üzerinden çizilir. Aynı kişiye gelen tüm mesajlar aynı
> kutuda toplanır — peer reconnect olsa bile `connId` değişmez. Yeni mesaj
> handler'larında bu Map anahtarını **connId dışında bir şeyle değiştirmeyin**.

### 8.1) Sohbeto arka plan servisi — P2P kapanmasın

GüneşOS içinde Sohbeto artık normal uygulama penceresi gibi tamamen öldürülmez.
Sistem açılınca `src/components/GunesOS.tsx` görünmez bir `sohbeto-background`
penceresi oluşturur; kullanıcı Sohbeto'yu kapatsa, masaüstüne dönse, Kuran/Oyunlar
gibi başka uygulamaya geçse bile iframe canlı kalır. Böylece WebRTC data channel,
LOOKUP cevapları, gelen mesaj ve gelen arama bekleme mantığı çalışmaya devam eder.

Kurallar:
- Sohbeto kapatılınca `windows` listesinden silinmez; `isBackground: true` +
  `isMinimized: true` yapılır.
- Arka plan Sohbeto görev çubuğunda, son uygulamalarda ve aktif pencere sayısında
  görünmez; sadece servis gibi çalışır.
- Sohbeto simgesine tekrar basılınca aynı iframe tekrar görünür yapılır. Yeni
  iframe açılmaz; motor state'i, P2P bağlantıları ve çağrı bekleme hali korunur.
- `WindowFrame` içindeki `isBackground` dalı çocukları unmount etmez; sadece 1×1
  görünmez alanda tutar. Bunu `return null`, `display:none` veya windows filtresiyle
  değiştirme; yoksa P2P yine ölür.

### 8.2) Sabit Sohbeto kasası — tekrar gir/çıkta kimlik kaybolmasın

Eski yapıda IndexedDB adı `sessionStorage` tab ID'sine bağlıydı
(`EgaNetwork_<tabId>`). Tarayıcı/PWA tamamen kapanıp açılınca tab ID değiştiği
için aynı kişi yeni/verisiz kasa ile başlıyordu; karşı taraf ilk etapta görse bile
sonraki gir-çıklarda çevrimiçi algılama ve kişi eşleşmesi bozuluyordu.

Yeni kural:
- `SOHBETO_DB_NAME` daima sabit `EgaNetwork` olmalı.
- `tabScopedKey()` outbox/offline queue gibi kritik P2P kuyruklarını sekmeye
  bağlamaz; yeniden girişte aynı kuyruk okunur.
- Profil/rehber/konuşma kayıtları sekme değil kullanıcı cihazı düzeyinde kalır.
  Yeni tema veya yeni HTML eklerken bu DB adını tekrar tab bazlı yapma.

## 8.3 — Tam Ekran Gelen Arama (GüneşOS Köprüsü)

Sohbeto arka planda (background iframe) çalışırken kullanıcı Kuran, Oyunlar
veya masaüstündeyken gelen arama görünmüyordu. Artık iki yönlü köprü var:

- `engine.js` → parent: `sohbeto:incoming-call` (mevcut), iptal/red/bitiş için
  yeni `sohbeto:incoming-call-cancelled` postMessage yollar.
- parent → `engine.js`: `sohbeto:remote-accept` ve `sohbeto:remote-reject`
  mesajları geldiğinde engine `acceptCall()` / `rejectCall()` çağırır.

GüneşOS `IncomingCallOverlay` bileşeni z-index `2147483600` ile tam ekran
açılır; Cevapla tıklanınca Sohbeto penceresi öne alınır + iframe'e
`remote-accept` yollanır. Reddet tıklanınca iframe'e `remote-reject` yollanır
ve `engine.js` `CALL_REJECT` sinyalini P2P üzerinden karşıya iletir.

İnvaryantlar:
- Overlay sadece `sohbeto:incoming-call` ile açılır, asla başka koddan tetiklenmez.
- Sohbeto iframe asla unmount olmaz (bkz. 8.1) — `acceptCall` çağrılabilir.
- Overlay `translate="no"` taşır (otomatik çeviri kilidi, bkz. Adım 7).

---

## Adım 7 — Açılış Akışı, Sohbet Tekilliği ve Ayarlar Geri-Nav (yeni temalar için sözleşme)

> **Bu adım engine.js'e dokunmaz.** Tüm değişiklikler `sohbeto-adapter.js` ve
> `sohbetoOO.html` ile React tarafındaki `src/components/apps/Sohbeto.tsx`
> içindedir. Yeni bir tema yazarken aşağıdaki sözleşmeyi koru.

### 7.1) Sohbet Listesi Tekilliği — Telefon Bazlı Anahtar (ZORUNLU)

Eskiden adapter, sohbet listesindeki dedup'u **görünen isim** (`display.toLowerCase()`)
üzerinden yapıyordu. Bu yüzden karşı taraf adını/profil etiketini değiştirdiğinde
**aynı numara için ikinci bir conv-item satırı** açılıyordu.

Yeni kural — `renderConvList` monkey-patch'inde:

```js
var phoneKey = (phoneForConn(connId) || '').replace(/[^\d+]/g, '');
var key = phoneKey || ('cid:' + (connId || display.toLowerCase()));
if (seen[key]) return;
seen[key] = true;
```

Yeni temalar için: tema kendi başına liste çizmiyor; adapter `oo.innerHTML`'i
yazıyor. Bu yüzden ek bir kod yazmana gerek yok — telefon bazlı tekillik
otomatik olarak gelir. Sadece liste container'ının
`#screen-sohbetler .content-area` (veya benzeri tek hedef) olduğundan emin ol.

**İsim/avatar değişimi** sadece mevcut satırın başlığını/avatarını günceller,
asla yeni satır yaratmaz. Aynı numara → aynı sohbet kutusu, kalıcı olarak.

### 7.2) Açılış Akışı — Önce İkon, Sonra Sohbetler

İki katmanlı bir splash var:

1. **React tarafı (`src/components/apps/Sohbeto.tsx`)** — iframe yüklenene
   kadar `<SohbetoIcon />` "So" ikonunu radial bir backdrop üstünde gösterir.
   - iframe `onLoad` + 350ms → splash fade-out (220ms).
   - 4 saniye güvence timeout'u: bir şey takılırsa yine kapanır.
   - iframe başlangıçta `opacity: 0`; ikon görünene kadar HTML arayüzü flash
     etmez.
2. **Adapter tarafı (`sohbeto-adapter.js`)** — splash kapanışından sonra
   ekran kararı:

   ```js
   if (loggedIn) enterMain();    // → screen-sohbetler
   else        showScreen('screen-phone');
   ```

   `loggedIn` algılaması (sırasıyla): `myNumber` global → `localStorage`
   anahtarları (`sohbet_my_number_v1`, `sohbeto.oo.profile.number`) →
   `getEngineState()` üzerinden `state.myNumber / state.identity / state.users`.

> **Yeni tema için:** Tema HTML'i kayıtlı kullanıcıyı **kendi başına** phone
> ekranına yönlendirmemeli. Adapter karar verir. Eğer temaya özel bir
> "tema seçici" ön ekran eklemek istersen, `enterMain` çağrısından önce
> kendi ekranını aç ve seçim sonrası `enterMain()` veya
> `showScreen('screen-phone')` çağır.

### 7.3) Ayarlar / Tema / Hesap'ta Alt Nav Görünür Kalır

Eskiden `screen-ayarlar`, `screen-tema`, `screen-hesap` `FULLSCREEN_OVERLAYS`
listesindeydi → `applyNavVisibility` bottom-nav'ı `display:none` yapıyordu.
Sonuç: Tema/Hesap alt sayfasına girince Sohbetler/Kişiler/Gruplar'a dönmek
**imkansızlaşıyordu** (sadece geri butonu kalıyordu, o da bir önceki ekrana
gidiyordu).

Yeni `FULLSCREEN_OVERLAYS` (sadece gerçek tam-ekran modal'lar):

```js
var FULLSCREEN_OVERLAYS = {
  'screen-chat': true,
  'screen-ooCall': true,
  'screen-ooIncoming': true,
  'screen-phone': true,
  'screen-auth': true
};
```

> **Yeni tema için:** Ayarlar veya alt sayfaları (`screen-ayarlar/-tema/-hesap/-gizlilik` vb.)
> için **alt nav'ın görünür kalması beklenir**. Eğer tema kendi alt
> sayfalarını overlay olarak çiziyorsa ve nav'ı gizlemek isterse, kendi
> tema-özel adapter'ında bu listeye ekleyebilir; ana adapter genel davranış
> olarak nav'ı gizli tutmaz.

### 7.4) İleri için — Henüz Yapılmadı (Adım 8 adayları)

Bu adımda **kapsam dışı tutulanlar**, bilinçli olarak ertelendi:

| # | Konu | Durum |
| - | ---- | ----- |
| a | Gizlilik bölümü (Ayarlar > Gizlilik): "Adımı kişilerimde olmayanlara göster" toggle. Açık → karşı tarafa "Abc seni arıyor", kapalı → sadece numara. | ⏳ |
| b | Kişiler kalıcılığı: hesap-bazlı (`contacts:<+90...>`) IndexedDB store; tab id sıfırlansa bile geri yüklensin. | ⏳ |
| c | Sohbet geçmişi kalıcılığı: `thread:<+90...>` anahtarı ile mesaj-bazlı IDB store + boot seed. | ⏳ |
| d | Tema seçici ön ekranı (`screen-themepicker`): kayıt öncesi 5–6 tema arasında seçim. | ⏳ |

Bu maddeler tek tek geldiğinde her biri için bu README'ye ek alt başlık
açılacak; sözleşme genişlemeleri (yeni DOM ID'leri, yeni adapter köprüleri)
yine burada belgelenecek.

---

## Adım 8 — Gizlilik Toggle'ı (Ayarlar > Gizlilik & Güvenlik)

> Engine'e dokunulmadı. Tüm değişiklik HTML + adapter.

### 8.1) UI

`#screen-gizlilik` ekranı + Ayarlar listesindeki "Gizlilik & Güvenlik" satırı
artık `app.openPrivacy()` ile bu ekranı açar. Tek toggle:

| ID | Görev |
| -- | ----- |
| `#privacyShowNameToggle` | "Adımı kişilerimde olmayanlara göster" |
| `#privacy-subtitle` | Ayarlar listesinde anlık özet metin |

### 8.2) Saklama

`localStorage` anahtarı **hesap-bazlı**:

```
sohbeto.oo.privacy.showName.<+90...>     // '1' = açık, '0'/yok = kapalı (varsayılan)
```

Numara kaynağı: `CONFIG.virtualNo` → `sohbeto.oo.profile.number` → `sohbet_my_number_v1`.

### 8.3) Davranış (engine'e dokunmadan)

Adapter `window.sendProfileUpdate`'i monkey-patch eder. Kapalıyken:

1. Hedef `HERKES` veya alıcı bizim **rehberimizde varsa** → orijinal akış (tam ad).
2. Aksi halde `state.nick` geçici olarak boşaltılıp `createProfileUpdatePacket()`
   üretilir, eski nick geri yüklenir, paket `sendWhenP2PReady` ile yollanır.
3. Karşı taraftaki `resolveDisplayName` boş ad → numaraya düşer; arama / mesaj
   bildirimlerinde kullanıcı sadece "+90… seni arıyor" görür.

Tercih değişince `scheduleProfileBroadcast(50)` çağrılarak tüm aktif peer'lara
güncel durum yeniden iletilir.

### 8.4) Yeni tema için sözleşme

Tema kendi gizlilik ekranını çizebilir; ama **şunlar zorunlu**:

- Toggle elementi `id="privacyShowNameToggle"` olmalı (input checkbox).
- Açılış fonksiyonu `app.openPrivacy()`, kapanış `app.closePrivacy()`.
- Adapter init sırasında toggle'ı `window.__privacyShowName()` ile senkronlar
  ve `change` event'inde tercih güncellenir; tema başka bir mantık eklemek
  zorunda değildir.
- "Sadece kişilerin görür" kuralı **alıcının rehberindeki varlığa bakmaz**;
  gönderici tarafta filtrelenir. Bu yüzden alıcının uygulaması güncel
  olmasa bile kural geçerlidir.

---

## Adım 9 — Hesap-bazlı kalıcı veri (GunesOSStore)

`public/apps/gunesos-store.js` → `window.GunesOSStore`

Tek paylaşımlı IndexedDB veritabanı `GunesOS` (tek store: `kv`). Anahtarlar
sanal klasör yolu gibi yazılır:

```
.gunesos/sohbeto/<+90...>/contacts
.gunesos/sohbeto/<+90...>/threads/<+90...>     (planlı — Adım 9.2)
.gunesos/sohbeto/<+90...>/profile              (planlı)
.gunesos/sohbeto/<+90...>/settings/privacy     (planlı)
.gunesos/sohbeto/_global/theme
```

**Neden:** Engine'in kendi `EgaNetwork_<tabId>` deposu tab id'sine bağlı;
yeni tab id ile veriler kaybolur. `GunesOS` paylaşımlı olduğu için telefon
numarası klasörü aynı kalır → kullanıcı verisi sekme reset'lerini atlatır.

**API:**
```js
GunesOSStore.get(key)                 // → value | null
GunesOSStore.set(key, value)
GunesOSStore.del(key)
GunesOSStore.listByPrefix(prefix)     // → [{key, value}, ...]
GunesOSStore.path.contacts(number)
GunesOSStore.path.thread(number, peerNumber)
GunesOSStore.path.profile(number)
GunesOSStore.path.privacy(number)
GunesOSStore.path.globalTheme()
GunesOSStore.debounce(fn, ms)
```

**Adapter köprüsü (kişiler):**
1. Boot + 1.5sn sonra `contacts/<+90...>` okunur, engine'in `contactsState`'ine
   eksik kayıtlar MERGE edilir (var olanlara dokunulmaz).
2. `window.renderContacts` monkey-patch'i her çağrıda 600ms debounced flush.
3. Ayrıca her 5 saniyede ve `beforeunload`'da güvence flush.

**Yeni tema sözleşmesi:**
- Temada kişiler eklendiğinde `renderContacts()` çağrılmalı (yoksa adapter
  yine 5sn'lik flush'ı yakalar ama anlık olmaz).
- Tema kendi storage'ını kullanırsa adapter yine ayna yapar; tema bir şey
  yapmak zorunda değildir.

---

## Adım 10 — Tema seçici ön ekranı (themepicker)

DOM: `#screen-themepicker` — splash kapandıktan sonra **ilk kez** açıyorsa
ve kullanıcı henüz giriş yapmamışsa gösterilir.

Akış:
```
Splash (So ikonu, 600ms)
   ├── loggedIn? → enterMain (sohbetler)
   └── değilse:
         ├── tema seçilmiş mi? → screen-phone
         └── seçilmemiş → screen-themepicker
                            └── kullanıcı seçer → screen-phone
```

Tema kaydı: `localStorage.sohbeto.oo.theme` + `.gunesos/sohbeto/_global/theme`
(iki yere de yazılır, ilki hızlı okuma için).

API: `window.__chooseTheme('OO')` — yeni tema eklemek için themepicker
listesine bir buton koy ve `window.__chooseTheme('YENI_TEMA_ADI')` çağır.
Adapter geri kalanını halleder.

Şu anda tek seçenek **OO**; ilerleyen sürümlerde 5–6 farklı tema buraya eklenecek.

---

## Adım 11 — Ayarlar alt-sayfaları + açılış splash görünürlüğü

Bu adımda iki UX sorunu giderildi.

### 11A) Ayarlar > Tema/Hesap/Gizlilik içindeyken alt nav direkt çalışmıyordu

**Sorun:** Kullanıcı `Ayarlar → Tema` (veya `Hesap` / `Gizlilik`) açıkken alttaki
`Sohbetler / Kişiler / Gruplar / Ayarlar` butonlarına bastığında ana sekme
arkada açılıyor ama alt-sayfa overlay'i (`screen-tema` vb. — `z-index:15`,
`.active`) üstte kaldığı için kullanıcı hâlâ aynı ekranı görüyordu.

**Çözüm:** `public/apps/sohbeto-fluid-tabs.js` içindeki `patchNavigate()`,
bir TAB hedefine (sohbetler/kisiler/gruplar/ayarlar) geçilmeden ÖNCE şu
overlay'leri kapatıyor:

```js
var SUBSCREEN_IDS = ['screen-tema', 'screen-hesap', 'screen-gizlilik'];
```

**Yeni tema sözleşmesi:** Ayarlar üstüne kendi alt-sayfanı (overlay) açan bir
ekran eklersen ID'sini bu listeye eklemelisin, aksi halde alt nav tıklaması
o overlay'i kapatmaz. Alternatif: overlay'i `.screen` sınıfı yerine ayrı bir
modal/sheet katmanı olarak yap (örn. `#dataInfoModal` gibi `position:fixed`).

### 11B) İlk açılışta "So" splash + tema seçici görünmüyordu

**Sorun:** React tarafındaki `Sohbeto.tsx` iframe'i yüklenene kadar `opacity:0`
ile gizleyip üstüne kendi splash overlay'ini koyuyordu. iframe görünür hale
geldiğinde içerideki `#screenSplash` zaten yarısı geçmiş oluyordu ve kullanıcı
"So" ikonunu doğru dürüst göremeden `screen-phone` ya da themepicker'a düşüyordu.

Ayrıca `screen-phone` HTML'de varsayılan **görünür** durumdaydı; splash kapanır
kapanmaz adapter karar verene kadar bir frame parlayabiliyordu.

**Çözümler:**
1. `src/components/apps/Sohbeto.tsx` — React-level splash overlay tamamen
   kaldırıldı. Sadece iframe yüklenene kadar koyu radial bir arkaplan
   gösteriliyor. Splash artık **tek kaynak**: iframe içindeki `#screenSplash`.
2. `public/apps/sohbetoOO.html` — `#screen-phone` artık varsayılan olarak
   `hidden-screen` sınıfıyla başlıyor. Adapter `setTimeout(600)` içinde hangi
   ekrana gideceğine karar verene kadar sadece splash görünür.

**Yeni tema sözleşmesi:**
- Splash mantığına dokunma. iframe açılışında `#screenSplash` her zaman
  görünür olmalı ve `.fade-out` sınıfı adapter tarafından eklenmeli
  (`public/apps/sohbeto-adapter.js`, ~satır 1992 civarı).
- Splash kapandığında gösterilecek ilk ekran karar matrisi:
  ```
  loggedIn?              → enterMain (screen-sohbetler)
  tema seçili değil?     → screen-themepicker
  aksi halde             → screen-phone
  ```
  Yeni tema eklerken bu üç çıktıdan birine düşmen gerekiyor.
- Yeni bir "ana ekran" (örn. `screen-phone` muadili) eklersen HTML'de
  `hidden-screen` ile başlat; görünürlüğünü adapter karar versin.

### 11C) Notlar (henüz yapılmadı — yapılacaklar)

Bildirim akışı (kullanıcı isteği) ileride şöyle olmalı:
- Masaüstündeyken yeni mesaj gelirse → sadece OS-bildirimi (GunesOS taskbar
  veya `Mesajlar` köprüsü) çıksın, ses iframe'den gelmesin.
- Sohbeto açıkken yeni mesaj gelirse → ses üstten gelen `topNotif` üzerinden;
  bildirime tıklayınca direkt ilgili `openChat(connId)` çağrısı.
- Engine'e dokunmadan, adapter'ın engine event'lerini dinlediği yere
  (`renderConvList` monkey-patch + yeni bir `MESSAGE_IN` köprüsü) bağlanacak.

Bu adım sonraki turda işlenecek; bu README ileride güncellenecek.

## Adım 12 — Kişi kartı avatarı: "son emoji" bug'ı + Splash/Themepicker doğrulaması

### 12A) Bug: Profil fotoğrafı olmayan kişide son emoji avatar olarak görünüyor
`sohbeto-adapter.js → openPeerCardByConnId()` içinde avatar şu mantıkla
çekiliyordu:
```js
var sourceAvatar = anchorEl.querySelector('img');
if (sourceAvatar && sourceAvatar.src) ...
```
Twemoji, mesaj balonlarındaki ve önizlemelerdeki emojileri
`<img class="emoji" src=".../twemoji/...svg">` haline getiriyor. Kişi kartı
mesaj balonundan ya da sohbet listesinden açıldığında bu **emoji img**'i
"profil fotoğrafı" sanılıp `ccAvatar`'a yerleştiriliyor — sonuç: sohbetteki
**son emoji** profil resmi gibi görünüyordu.

**Düzeltme:** Selector daraltıldı + twemoji elendi:
```js
sourceAvatar = anchorEl.querySelector(
  '.conv-avatar img, .contact-avatar img, .chat-h-avatar img, .cc-avatar img, .profile-pic img'
);
if (sourceAvatar && (sourceAvatar.classList.contains('emoji') ||
    /twemoji|emoji/i.test(sourceAvatar.src || ''))) sourceAvatar = null;
```
Artık sadece **gerçek avatar kapsayıcılarındaki** img'ler kabul ediliyor;
profil fotoğrafı yoksa `getInitials(name, number)` baş harfleri gösteriliyor.

> **Tema yazarken kural:** Avatar img'lerini DAİMA `.conv-avatar`,
> `.contact-avatar`, `.chat-h-avatar`, `.cc-avatar` ya da `.profile-pic`
> sınıflı bir kapsayıcı içine koy. Aksi halde adapter onları "gerçek profil
> fotoğrafı" sanmaz ve baş harfe düşer. Twemoji emojilerini özel olarak
> ele almaya gerek yok — sınıf adı `emoji` veya src'de `twemoji` geçen
> img'ler otomatik olarak avatar adayı sayılmıyor.

### 12B) Dev kancası: `?fresh=1`
İlk-açılış akışını (splash + arayüz seçici) hızlıca test etmek için adapter'a
küçük bir dev kancası eklendi. `sohbetoOO.html?fresh=1` ile açıldığında:
- `sohbeto.oo.theme`, `sohbet_my_number_v1`, `sohbeto.oo.profile.number`
  localStorage anahtarları temizlenir,
- `GunesOSStore` üzerindeki `globalTheme()` değeri sıfırlanır,
- Engine "zaten giriş yapmış" derse bile loggedIn kısa-devresi atlanır,
  doğrudan **screen-themepicker** gösterilir.
Parametre verilmediğinde hiçbir etkisi yok; ürünleşmiş akışı bozmuyor.

### 12C) Doğrulama (browser screenshot)
`?fresh=1` ile yapılan testte sıra şöyle çalışıyor:
1. `screenSplash` (So ikonlu) ~600ms görünür ve fade-out olur,
2. `screen-themepicker` açılır: büyük "So" ikonu + "Sohbeto ile birçok
   arayüz seni bekliyor" başlığı + **OO arayüzü** kartı + "Yakında daha
   fazla arayüz" placeholder'ı.
3. OO seçilince `sohbeto.oo.theme=OO` yazılır ve `screen-phone`'a düşer.

Yeni kullanıcılar için akış doğru. (Mevcut kullanıcılar, daha önce kayıt
oldukları için zaten doğrudan `screen-sohbetler`'e gidiyor.)

---

## Adım 13 — Sohbetler başlığı: Gelen Kutusu / Aramalar / Notlar

Sohbetler ekranı başlığındaki tek "kalem" ikonu kaldırıldı; yerine 3 ikon geldi
(soldan sağa):

1. **Gelen Kutusu** (`fa-envelope`) — rehberde olmayanlardan gelen mesaj ve
   arama istekleri. Tam ekran açılır.
2. **Aramalar** (`fa-phone`) — çevrimdışıyken seni arayanların listesi (adapter
   içindeki `oo_offline_call_queue_v1__*` kuyruğundan beslenir). Tam ekran.
3. **Not Defteri** (`fa-pen-to-square`) — kişisel notlar, tarih/saat damgalı,
   `GunesOSStore` ile **IndexedDB** içinde `.gunesos/sohbeto/<+90...>/notes/`
   yolunda kalıcı. Tam ekran liste + tam ekran editör.

İkonların üzerinde **kırmızı rozet** (1, 2, ... 9+) okunmamış sayısını gösterir.
Rozet 5 saniyede bir tazelenir; ekran açıldığında ilgili sayaç sıfırlanır.

### Tam-ekran overlay sözleşmesi

Tüm 3 ekran `.fs-screen` sınıfını taşır ve `transform: translateX(100%)` ile
sağdan kayarak girer. Geri tuşu (`[data-fs-close="screen-..."]`) overlay'i
kapatır. Ayrıca **alt nav'a basılınca** `fluid-tabs.js` içindeki
`closeSettingsSubscreens()` (SUBSCREEN_IDS dizisine 3 yeni id eklendi) bu
ekranları otomatik kapatır — yani Sohbetler içindeyken Notlar'ı açıp alt nav'dan
"Kişiler"e basınca direkt Kişiler'e gider.

### Not defteri kalıcılığı

- Index: `.gunesos/sohbeto/<num>/notes/__index__` → `{ ids:[], byId:{ id:{title,snip,createdAt,updatedAt} } }`
- Her not: `.gunesos/sohbeto/<num>/notes/<id>` → `{ id, title, body, createdAt, updatedAt }`
- Liste, **son güncellemeye göre** sıralanır; her kart başlık, snippet, tarih,
  silme ikonu gösterir.
- Editör'de "Kaydet" veya geri tuşu kaydı tetikler. Hem başlık hem gövde boşsa
  kaydetmez (gereksiz kayıt oluşmaz).

### Aramalar & Gelen Kutusu

- **Aramalar** mevcut adapter'in `oo_offline_call_queue_v1__*` kuyruğunu okur;
  gelecekte `.gunesos/sohbeto/<num>/calls` altına ek kayıtlar da düşülebilir
  (zaten desteklidir). "Temizle" ikonu kuyruğu boşaltır.
- **Gelen Kutusu** `.gunesos/sohbeto/<num>/inbox` yolundan okur. Rehberde
  olmayan kişilerden gelen mesajlar/arama istekleri buraya
  `SohbetoExtras.appendInbox({ name, number, kind:'msg'|'call', text })` ile
  düşürülmek üzere hazır. (Engine entegrasyonu bir sonraki adımda.)

### "Çevrimdışıydın" mesajının küçültülmesi

`sohbeto-adapter.js` içinde çevrimdışı kullanıcı online olunca gönderilen
otomatik bilgilendirme mesajı **başında 📞 emojisi olmadan**, sade ve normal
boyutta yazılmış bir cümleye çevrildi:

> _Saat HH:MM civarında seni sesli arama ile aradım ama çevrimdışıydın._

Tek başına emoji, twemoji + balon font-size kombinasyonunda büyük görünebildiği
için kaldırıldı. Yeni metin tek satır, kibar ve stabil.

### Yeni kural — başlık (header) yapısı

`#screen-sohbetler .main-header` artık tek bir `header-icon` kullanmaz.
`extras` dosyası header'a `<div class="hdr-icons">` enjekte eder ve içine
`hdr-inbox` / `hdr-calls` / `hdr-notes` koyar. **Header'a yeni ikon eklemek
isteyenler `injectHeaderIcons` fonksiyonuna eklemeli**, doğrudan HTML'i
düzenlememeli (aksi halde mutation observer yeniden enjekte edip tekrar yazar).

---

## Adım 14 — Kişi Kartı: 3 boyut + 3 animasyon (Ayarlar > Tema)

### Yeni dosya: `sohbeto-card-anim.js`
Çekirdek motor/adapter'a dokunmadan `#contactCardOverlay`'e iki sınıf
ailesi ekleyen küçük bir modül:

| Aile     | Değerler                              | Varsayılan   | localStorage anahtarı  |
|----------|---------------------------------------|--------------|------------------------|
| Boyut    | `size-lg`, `size-md`, `size-sm`       | `size-lg`    | `sohbeto.oo.cardSize` (`lg`/`md`/`sm`) |
| Animasyon| `anim-default`, `anim-spin`, `anim-flip` | `anim-default` | `sohbeto.oo.cardAnim` (`default`/`spin`/`flip`) |

- **size-lg** → mevcut büyük kart (340px) — varsayılan, geri uyum garanti.
- **size-md** → 280px, küçük avatar (78px), kompakt aksiyonlar.
- **size-sm** → 230px, minimal kart (60px avatar).
- **anim-default** → mevcut "tıklanan noktadan büyüyerek aç, küçülerek geri dön" davranışı (`--tx/--ty` origin ile).
- **anim-spin** → kart `-540deg → 0deg` ile dönerek büyür, kapanırken ters yöne dönerek küçülür.
- **anim-flip** → 3B perspective ile `rotateY(115deg)` flip-in, kapanışta `-115deg` flip-out (sürpriz).

### Ayarlar UI
`screen-tema` içine "Profil Fotoğrafı Kartı — Boyut" ve "— Animasyon" başlıklı
iki yeni `settings-section` eklendi. Her biri 3 sütunlu `.pick-grid > .pick-tile`
grid'i. Aktif tercih `.pick-tile.active` ile vurgulanır.

### Davranış garantisi
- Modül boot anında `MutationObserver` ile `#contactCardOverlay`'in `class`
  attribute'unu izler; sınıflar her şekilde tekrar uygulanır (motor `open`/`closing`
  toggle'larken bile size/anim sınıfları korunur).
- Ayarlar > Tema ekranı dinamik açıldığında `.pick-tile` butonları DOM observer
  ile yeniden bağlanır — duplicate event listener oluşmaz (`__bound` flag).

### Yeni animasyon eklemek isteyenler
1. `sohbetoOO.html` içine `#contactCardOverlay.anim-X .contact-card { ... }` +
   `.open` ve `.closing` durumlarını ekleyin.
2. `sohbeto-card-anim.js` içindeki `ANIMS` dizisine `'X'` ekleyin.
3. `screen-tema` `cardAnimPicker` grid'ine `data-anim="X"` butonu ekleyin.

### Yeni boyut eklemek isteyenler
Aynı pattern: CSS varyantı + `SIZES` dizisi + `cardSizePicker` butonu.
