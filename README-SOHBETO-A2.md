# Sohbeto A2 — Yol Haritası ve İlerleme

Bu dosya `public/apps/sohbetoA2.html` arayüzü için yapılan/yapılacak işleri takip eder.

## 🚗 Montaj Mantığı (her A-arayüzü için geçerli)

Bir araba düşün:

| Parça        | Dosya                                                | Rolü                                                                 |
|--------------|------------------------------------------------------|----------------------------------------------------------------------|
| **Motor**    | `sohbeto-engine.js`                                  | Tüm iş mantığı: kimlik, IndexedDB, mesaj/çağrı kuyruğu, şifreleme.   |
| **Şanzıman** | `sohbeto-adapter.js`                                 | Motoru UI'a bağlayan kolaylık katmanı (offline call queue vb.).      |
| **Aksesuar** | `sohbeto-extras.js`, `sohbeto-fluid-tabs.js`, `sohbeto-card-anim.js` | Notlar/Aramalar/Gelen Kutusu, akışkan tab, kart animasyonu.          |
| **Yakıt deposu** | `gunesos-store.js`                              | Ortak veri sandığı (IndexedDB üzerinden `.gunesos/sohbeto/<num>/...`). |
| **OO Kaporta**   | `sohbetoOO.html`                                | İlk arayüz; tüm parçaları kullanan referans şasi. **DOKUNULMAZ.**    |
| **A2 Kaporta**   | `sohbetoA2.html`                                | İkinci tasarım. Aynı motora bağlanır, kendi paneli/kadranı vardır.   |

**Kural:** Motor, şanzıman ve yakıt deposunu değiştirmiyoruz. Her yeni kaporta
(A2, A3, …) aynı sandıktan (`gunesos-store.js` + `localStorage`'daki
`oo_offline_call_queue_v1__*` gibi anahtarlar) **okur**; yazma sorumluluğu
motor/şanzımanda kalır. Böylece bir arayüzün gördüğü veri diğer arayüzlerde de
görünür, kimse motoru kirletmez.

A2'ye yeni bir ekran (örn. Aramalar) eklerken yaptıklarımız:
1. Gerekirse `gunesos-store.js`'i A2'ye dinamik `<script>` olarak yükle (sadece okuma).
2. UI'ı A2 stiline uygun kur (tam-ekran katman, A2 renkleri, A2 ikon stili).
3. Veri kaynağı olarak motor/adapter'ın yazdığı aynı `localStorage` ve `GunesOSStore` yollarını kullan.
4. Hiçbir motor/adapter dosyasına dokunma — kural #1.

Referans: `public/apps/sohbetoOO.html` (DOKUNULMAZ). Motor/aksesuar dosyaları
da DOKUNULMAZ. Tüm yeni mantık yalnızca `sohbetoA2.html` içinde yaşar.

İleride 5–6 farklı arayüz daha gelecek; bu README sıralı checklist olarak
büyüyecek. Her tamamlanan adımı [x] yap, yeni adımı [ ] ekle.

---


## Tamamlananlar

### 1) Kişi Ekle / Grup Oluştur butonları (ilk iş)
- [x] Kişiler sekmesindeki `+` butonu A2 temalı bottom-sheet açıyor
      (`openAddContactSheet`). İsim + telefon alanı, kayıt → `sohbetoA2_contacts`
      localStorage, A2 toast.
- [x] Gruplar sekmesindeki `+` butonu A2 temalı bottom-sheet açıyor
      (`openAddGroupSheet`). Grup adı + üye seçimi, kayıt →
      `sohbetoA2_groups` localStorage, A2 toast.
- [x] Her iki listede arama filtresi ile satır render.

### 2) Fluid Tabs (parmakla geçiş) — ilk entegrasyon
- [x] 4 ana sekme (chats / people / groups / settings) `.tab-stack`
      konteyneri içine alındı.
- [x] `sohbeto-fluid-tabs.js` mantığı (pager, 240 ms snap, %24 ratio,
      0.42 rubber, flick eşiği) A2 içine inline taşındı.
- [x] Sohbet odası açıldığında tab stack gizlenir.
- [x] `showAppShell` ilk açılışta tab 0'a snap eder + kişi/grup
      listelerini render eder.

### 3) Doğrulama akışı — OO ile aynı zamanlama (şu anki iş)
- [x] Üst bildirim (`#a2NotifLayer`) Mesajlar tarzı düşüyor; alt
      bildirim olarak gelmiyor (OO ile aynı pozisyon: ekranın üstü).
- [x] 3'lü hoş geldin mesajı zinciri (`a2WelcomeBurst`): 600 ms + 2500 ms
      aralarla, her biri 1400 ms ekranda — OO ile birebir.
- [x] OTP otomatik doldurma (`a2FillOtp`) 180 ms aralıkla, pulse glow.
- [x] **OO kuralı: OTP otomatik doluyken hemen içeri dalmaz.** 6 hane
      tamamlandıktan sonra 2500 ms bekler, buton "Doğrulanıyor…" gözükür,
      sonra `a2Post('verifyCode')` tetiklenir. Manuel "Doğrula" butonu
      hâlâ anında çalışır.
- [x] Autofill esnasında input event ile çift verify tetiklenmesin diye
      `window.__a2AutoFilling` guard'ı eklendi.

### 4) Hoş geldin mesajları — OO ile birebir + Mesajlar entegrasyonu
- [x] **Doğrulama kodu mesajı** (ilk mesaj) OO ile birebir:
      `🔐 Sohbeto Doğrulama Kodun: XXXXXX\nKodu kimseyle paylaşma. Bu kod 5 dakika geçerlidir.`
      Hem üst bildirim (4500 ms) hem de Mesajlar uygulamasına yazılıyor.
- [x] 3 hoş geldin mesajının metinleri OO `sohbeto-adapter.js` ile birebir
      (👋 Merhaba…, Sohbeto'ya başarıyla kaydoldun…, 💡 İpucu…).
- [x] Zamanlama OO ile aynı: 800 ms + i*5000 ms aralarla, her biri 4500 ms
      ekranda (üst bildirim).
- [x] Tüm mesajlar (kod + 3 hoş geldin) GünesOS Mesajlar uygulamasına
      **tek kaynak üzerinden** yazılıyor: ana GüneşOS dinleyicisi
      `sohbeto:code` / `sohbeto:registered` olaylarını dinleyip
      `gunesOS-mesajlar` içindeki `sohbeto-welcome` thread'ine kaydediyor.
      A2 artık Mesajlar localStorage'ına doğrudan yazmaz; yalnızca üst
      bildirimi gösterir ve OTP'yi doldurur.

### 4b) Çakışma + çift kayıt düzeltmesi
- [x] `a2ClearNotifs()` eklendi; hoş geldin akışı başlamadan ve her yeni
      karşılama mesajından önce ekrandaki açık bildirim balonu kapatılıyor.
      Böylece OO'daki gibi doğrulama kodu balonu kaybolunca sıradaki balon
      düşüyor; iki balon aynı anda üst üste binmiyor.
- [x] İlk denemede `a2PushToMesajlar` ile dedupe guard eklendi; ancak gerçek
      çakışmanın iki ayrı yazıcıdan geldiği görüldü: A2 doğrudan yazıyor,
      GüneşOS ana dinleyicisi de aynı olayı Mesajlar'a yazıyordu.

### 4c) Mesajlar uygulamasında çifter kayıt fix'i
- [x] **Asıl sorun:** Doğrulama kodu ve 3 hoş geldin mesajı Mesajlar
      uygulamasına çifter çifter düşüyordu; toplam 4 yerine 8 mesaj oluyordu.
      Ekran görüntüsündeki liste Sohbeto içi bildirim değil, GüneşOS
      masaüstündeki **Mesajlar uygulaması** listesiydi. Sebep A2'nin
      `a2PushToMesajlar` ile localStorage'a doğrudan yazması + ana GüneşOS
      listener'ının aynı `sohbeto:code` / `sohbeto:registered` olaylarını zaten
      Mesajlar'a yazmasıydı.
- [x] **Net çözüm:** A2 tarafındaki doğrudan Mesajlar yazımı kaldırıldı.
      `a2PushToMesajlar` fonksiyonu ve çağrıları devreden çıkarıldı/silindi.
      Artık A2 sadece üst bildirimi gösterir; Mesajlar uygulamasına kayıt tek
      kaynak olan ana GüneşOS dinleyicisinden gelir. OO / engine dosyalarına
      dokunulmadı (kural #1).

### 5) Sohbetler başlığı 3 ikon + Aramalar tam ekran (A2 sürümü)
- [x] Sohbetler başlığındaki tek "✎" butonu **3 ikona** çıkarıldı:
      Gelen Kutusu (zarf), Aramalar (telefon), Yeni sohbet (kalem). Kalem en
      sağda, A2 tema rengiyle (cam etkili buton + accent renk) duruyor.
- [x] **Aramalar** ikonu A2'ye özgü bir tam-ekran katman (`#a2FsCalls`) açar:
      A2 cam/akvaryum arkaplanı, A2 renkleri, üstte geri + temizle butonu.
- [x] Veri kaynağı motor/adapter ile aynı (kural #1):
        · `localStorage` → `oo_offline_call_queue_v1__<num>` (cevapsız çağrı)
        · `GunesOSStore` → `.gunesos/sohbeto/<num>/calls` (zenginleştirilmiş log)
- [x] A2, `gunesos-store.js`'i sadece okumak için dinamik `<script>` ile yüklüyor;
      hiçbir motor dosyasına dokunmuyor.
- [x] Aramalar ikonunda kırmızı rozet: toplam (offline kuyruğu + store) sayısı.
      `storage` event'ine abone; başka pencerede oluşan çağrılar A2'ye yansır.
- [x] Boş durum (motivasyonel ikonlu kart) + tarih biçimlendirmesi (bugün → HH:mm,
      diğer günler → DD.MM HH:mm).
- [x] Temizle butonu hem `oo_offline_call_queue_v1__*` anahtarlarını hem de
      `GunesOSStore` `calls` kaydını sıfırlar.
- [x] Gelen Kutusu ve Yeni Sohbet ikonları görünür ama bu adımda pasif
      (toast: "sıradaki adımda inşa edeceğiz") — kullanıcı isteği:
      **sayfa sayfa gidiyoruz.**

### 6) Kalem → Not Defteri + Gelen Kutusu (rehberde olmayanlar)

> Kullanıcı kararı: sağdaki kalem (✎) ikonu artık **Yeni Sohbet** değil
> **Not Defteri**'dir. Yeni sohbet ileride başka bir yerden inşa edilecek.

- [x] `#a2HdrCompose` → `#a2HdrNotes`'a yeniden adlandırıldı; title/aria
      "Not Defteri" oldu. İkon aynı (✎), A2 accent rengiyle duruyor.
- [x] **Not Defteri** tam-ekran katmanı (`#a2FsNotes`) eklendi: A2 stiline
      uygun kart listesi, sağ üstte ＋ butonu, açıldığında başlık + içerik
      editörü (`#a2NoteEditor`). Kaydet/Geri/Sil aksiyonları çalışıyor.
- [x] **Kalıcılık (cache değil, IndexedDB):** Notlar OO ile birebir aynı
      yola yazılıyor — `gunesos-store.js` üzerinden tarayıcı IndexedDB'sinde:
        · İndeks: `.gunesos/sohbeto/<num>/notes/__index__`
                  (yapı: `{ ids: [], byId: { id: { id, title, snip, createdAt, updatedAt } } }`)
        · Tekil not: `.gunesos/sohbeto/<num>/notes/<id>`
                  (yapı: `{ id, title, body, createdAt, updatedAt }`)
      Bu sayede OO'da yazılan not A2'de, A2'de yazılan not OO'da görünür.
      Tarayıcı verisi temizlenmedikçe yaşar (localStorage gibi 5 MB sınırı yok).
- [x] **Gelen Kutusu** tam-ekran katmanı (`#a2FsInbox`) eklendi. Rehberde
      olmayan kişilerden gelen **mesaj / sesli arama / görüntülü arama / grup
      daveti** istekleri burada listelenir. Her satırda kişi adı (veya numara),
      tür rozeti (zarf / telefon / grup), zaman damgası ve Sil butonu var.
      Açıldığında okunmamışlar `seen=true` damgası alır, header rozeti
      güncellenir. 🗑 butonu (onaylı) tüm kutuyu boşaltır.
- [x] **Veri kaynağı (read-only):** `.gunesos/sohbeto/<num>/inbox` (IndexedDB
      üzerinden GunesOSStore). Bu listeye yazan motor/extras tarafıdır:
      `sohbeto-extras.js` engine'in `renderIncomingMsg`, `handleCallSignal`,
      `showIncomingCall` fonksiyonlarını sarıp `isKnownConn` + `isAllowedConn`
      kontrolünden geçmeyen istekleri buraya düşürür. **A2 burayı sadece okur
      ve siler.** Kural #1: motor/adapter/extras dosyalarına dokunmuyoruz.
- [x] Gelen Kutusu için header rozeti (`#a2HdrInboxBadge`): açılış sırasında
      ve 600/2500 ms gecikmeli iki tazeleme ile güncellenir.

---

### 6b) Not editörü açılış animasyonu + CSS bug fix
- [x] **Bug:** CSS string concat'inde araya kaçan `;` yüzünden `.a2-note-editor`,
      `.a2-ne-title`, `.a2-ne-body` kuralları stylesheet'e hiç eklenmiyordu. Bu
      yüzden editor stilsiz açılıp ekranın altında küçük/bozuk görünüyordu.
      `+` butonuna basmadan da görünüyormuş gibi hissettiriyordu çünkü
      konumlandırma çalışmıyordu.
- [x] **Fix:** Stray `;` kaldırıldı, tüm not-editor kuralları artık stylesheet'e
      ekleniyor.
- [x] **Açılış animasyonu:** Editor artık varsayılan olarak `translateY(-110%)`
      + `opacity:0` + `visibility:hidden` ile gizli duruyor. `+` butonuna
      basıldığında `.open` sınıfı ekleniyor ve yukarıdan aşağıya yumuşak bir
      `cubic-bezier(.22,.9,.28,1.2)` yay efektiyle kayarak iniyor. Kapanırken
      yukarı çıkıp kayboluyor. Yani: **sadece `+` ile tetiklenir, otomatik
      açılmaz, alttan değil üstten gelir.**
- [x] Başlık + textarea focus state'lerine accent renkli ring + yumuşak shadow
      eklendi (A2 cam estetiğiyle uyumlu).

### 7) Yeni Sohbet (compose) — ileride
- [ ] Kalem ikonu artık Not Defteri'ne ait olduğu için "Yeni Sohbet" için
      ayrı bir giriş noktası belirleyeceğiz (örn. sohbet listesi altında
      yüzen FAB veya Kişiler sekmesinden direkt başlatma).

### 8) Kişiler — Kişi Kartı iskeleti + Tema (Adım 8a)

> Kullanıcı kararı: önce **iskelet**, sonra canlı bağlama (Mesaj → Sesli → Görüntülü).

- [x] **IndexedDB kalıcılığı (kişiler):** Kişiler artık OO ile aynı sandığa
      yazılıyor: `gunesos-store.js` üzerinden `.gunesos/sohbeto/<num>/contacts`.
      `localStorage('sohbetoA2_contacts')` artık sadece "hızlı ayna":
        · İlk açılışta IDB doluysa → localStorage IDB'den seed edilir.
        · IDB boş + localStorage doluysa → IDB localStorage'dan seed edilir.
        · Her `writeContacts(arr)` çağrısı sarıldı: yazımdan hemen sonra
          aynı dizi `GunesOSStore.set(contacts, arr)` ile IDB'ye yansıtılır.
      Render kodu eskisi gibi `localStorage`'dan senkron okur; kalıcılık IDB'de.
- [x] **Kişi Kartı overlay'i (iskelet):** Kişiler sekmesindeki bir satıra
      tıklayınca A2 temalı kart (`#a2CcOverlay > .a2-cc`) açılır:
        · Avatar (baş harfler, accent gradient) · İsim · Telefon
        · 3 aksiyon: **Sesli / Görüntülü / Bilgi** (şu an toast, motor sonradan bağlanacak)
        · Tam genişlikte **Mesaj Gönder** butonu (şu an toast)
      Backdrop'a basınca kart kapanır.
- [x] **3 animasyon × 3 boyut:** OO'daki sözleşmenin birebir A2 sürümü.
        · Boyutlar: `size-lg` (varsayılan) / `size-md` / `size-sm`
        · Animasyonlar:
            - `anim-default` — tıklanan noktadan büyür/küçülür (`--tx/--ty` set edilir)
            - `anim-spin`    — 540° dönerek açılır, ters yöne dönerek kapanır
            - `anim-flip`    — 3B kart çevirme (perspective + rotateY/X)
- [x] **Ayarlar›Tema bölümü:** Settings menüsüne (Akvaryum satırından önce)
      🎨 **Tema** satırı eklendi. Tıklayınca tam-ekran `#a2ThemeFs` katmanı
      açılır; iki seçim ızgarası:
        · **Kişi Kartı — Boyut**     (Büyük / Orta / Küçük)
        · **Kişi Kartı — Animasyon** (Klasik / Dönerek / Sürpriz)
      Seçim anında karta uygulanır + IndexedDB'ye yazılır:
        · `.gunesos/sohbeto/_global/a2.cardSize`
        · `.gunesos/sohbeto/_global/a2.cardAnim`

### 8b) Kişiler — sonraki adım (canlı bağlama)
- [ ] **Mesaj Gönder** → A2 sohbet odasını aç (`goTo('chatroom')` + ilgili peer).
- [ ] **Sesli / Görüntülü** → motor/adapter çağrısı (`startAudioCall` /
      `startVideoCall`) — OO'daki conn id eşlemesini al.
- [ ] **Bilgi** → A2 stilinde bilgi sheet'i (avatar, isim, numara,
      bağlantı türü, son görülme).
- [ ] **Düzenle / Sil** aksiyonları (uzun bas?).

### 9) Gruplar — grup kartı + üye listesi
- [ ] Grup kartına tıklayınca üye listesi sheet'i.
- [ ] Grup sohbeti odası (chatroom modu) ile entegrasyon.

### 10) Cilalama
- [ ] Boş ekran ("Henüz kişi yok / Henüz grup yok") görselleri.
- [ ] Toast pozisyon ince ayarı (üst safe-area).
- [ ] Arama ekranı input davranışı.



---

## Kurallar (her arayüz için geçerli)

1. `sohbetoOO.html` ve `public/apps/sohbeto-*.js` **salt referanstır**, 1
   harf bile değişmez.
2. Tüm yeni mantık ilgili A-serisi dosyanın (A2, A3, …) içinde inline yaşar.
3. Zamanlama (180 / 250 / 2500 ms) ve metinler OO'dan birebir kopyalanır.
4. `localStorage` anahtarları arayüz prefix'i ile yazılır (`sohbetoA2_*`,
   ileride `sohbetoA3_*` vs.) — OO verisi kirletilmez.
5. Her tamamlanan adım buraya [x] olarak yazılır, yeni hedef [ ] olarak
   eklenir.

---

## Adım 8b — Kişi Kartı: ikon + renk uyumu, animasyon onarımı, "Mesaj Gönder" bağlantısı

**Tarih:** 2026‑05‑18 · **Dosyalar:** `public/apps/sohbetoA2.html`

### Neyi düzelttik

1. **FontAwesome eklendi** (`<head>`'de OO ile aynı CDN linki). Artık kişi
   kartındaki simgeler emoji yerine OO'daki ile **birebir** aynı: `fa-solid
   fa-phone` (Sesli), `fa-solid fa-video` (Görüntülü), `fa-solid
   fa-circle-info` (Bilgi), `fa-regular fa-comment` (Mesaj Gönder).
2. **Renk paleti birleşti.** "Mesaj Gönder" butonu A2 accent gradient'i
   (`var(--accent)` → `#67d6c4`) kullanıyordu. Sesli/Görüntülü/Bilgi
   butonları da artık aynı aileyi paylaşıyor: arka plan `rgba(42,166,200,.10)`
   (accent'in açık tint'i), ikon + etiket rengi `var(--accent)`. OO'daki
   `--light-green-bg + --primary-green` örüntüsünün A2 muadili.
3. **Animasyon bug'ı giderildi.** `.a2-cc-overlay` artık `display:none`
   yerine `visibility:hidden` ile gizleniyor. Böylece kart açılmadan önce
   DOM'da render ediliyor ve `anim-spin`/`anim-flip` başlangıç transform'u
   (`scale(.05) rotate(-540deg)` / `rotateY(115deg)`) browser tarafından
   gerçekten "ilk durum" olarak okunuyor. Ek olarak `.open` eklemeden önce
   `ccOverlay.offsetWidth` ile **forced layout** + **çift `requestAnimationFrame`**
   uygulandı; bu olmadan spin/flip "snap" yapıyordu (sadece klasik animasyon
   çalışıyordu — kullanıcı uyarısı bu yüzdendi).
4. **"Mesaj Gönder" → chatroom bağlandı.** Kart kapanır kapanmaz
   `openA2ChatFor(contact)` çağrılıyor:
   - `#chatName` → kişi adı, `#chatAvatar` → baş harf(ler)i
   - `#stream` aynı kişi için açılırsa eski mesajlar korunur, **farklı**
     kişi açılırsa stream temizlenir (`data-peer` attribute'u ile takip).
   - `goTo('chatroom')` → app shell `chatroom-mode`'a geçer, tab-stack
     gizlenir, A2'nin kendi sohbet ekranı görünür.
   - Mesaj akışının motora (engine/adapter) bağlanması **Adım 8c**'ye
     bırakıldı; şimdilik mevcut `sendMsg()` lokal balonu üretir.

### Sesli / Görüntülü / Bilgi durumu

Hâlâ iskelet: `a2Notify` ile "yakında bağlanacak" toast'u gösteriyor. Bunlar
**Adım 8d** (arama köprüsü) + **Adım 8e** (bilgi paneli) içinde
`sohbeto-engine.js` ve `sohbeto-adapter.js`'in `startCallFromCard` / OO'daki
`ccCall`/`ccVideo` örüntüsü referans alınarak bağlanacak. **Motor / adapter
dosyalarına 1 satır bile yazılmayacak**; A2 köprüsü kendi içinde mevcut
window.* API'larını çağıracak.

### Sonraki adım — Arama ekranı

Kullanıcı talebi: arama ekranı için ayrı bir tasarım turu gelecek. O turda:
- Aramalar sekmesi (telefon ikonu sağdaki üçüncü ikon) + `aramalar` page'i
- Gelen / giden / cevapsız ayrımı
- Tıklayınca aynı kişi kartı (Sesli/Görüntülü/Bilgi/Mesaj Gönder) açılacak
- Veriler `.gunesos/sohbeto/<num>/calls` altında IndexedDB'de duracak

---



## Bekleyen arayüzler

- [ ] sohbetoA3.html (planlama bekleniyor)
- [ ] sohbetoA4.html
- [ ] sohbetoA5.html
- [ ] sohbetoA6.html
- [ ] sohbetoA7.html

---

## 9) Açılış flash düzeltmesi (Ayarlar sekmesi bir an gözüküyordu)

**Sorun:** Sohbeto A2 açılırken çok kısa bir an (≈100ms) "Ayarlar" sekmesi
parlıyordu, sonra "Sohbetler" geliyordu.

**Sebep:** `.tab-stack > .page` CSS'inde `position:absolute; inset:0;
display:flex !important` tanımlı. 4 sayfa `tabStack`'e eklenince hepsi
translate(0,0) ile üst üste biniyor, en son eklenen `settings` en üstte
kalıyor. `setActiveTab(0, false)` çağrılana kadar (bir-iki frame) settings
görünüyor.

**Çözüm (sadece A2):** Sayfaları `tabStack`'e eklerken hemen inline
`transform: translate3d(i*100%,0,0)` ve `tab-inactive` class'ı uygulanıyor.
`tabStack` ilk frame'de `.instant` ile (transition'sız) eklenip iki rAF
sonra kaldırılıyor. Böylece settings sayfası hiçbir frame'de görünür
konumda olmuyor.
