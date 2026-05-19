# Sohbeto A2 — Yol Haritası ve İlerleme

Bu dosya `public/apps/sohbetoA2.html` arayüzü için yapılan/yapılacak işleri takip eder.
Referans: `public/apps/sohbetoOO.html` (DOKUNULMAZ). Motor dosyaları
(`sohbeto-engine.js`, `sohbeto-adapter.js`, `sohbeto-fluid-tabs.js`,
`sohbeto-extras.js`, `sohbeto-card-anim.js`, `gunesos-store.js`) DOKUNULMAZ.
Tüm yeni mantık yalnızca `sohbetoA2.html` içinde yaşar.

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
- [x] Tüm mesajlar (kod + 3 hoş geldin) GünesOS Mesajlar uygulamasına da yazılıyor
      (`gunesOS-mesajlar` localStorage, thread `sohbeto-welcome`,
      `gunesos-mesajlar-changed` event dispatch). `src/lib/messaging.ts`
      sözleşmesine birebir uyuyor; o dosyaya dokunulmadı.

### 4b) Çakışma + çift kayıt düzeltmesi
- [x] `a2ClearNotifs()` eklendi; hoş geldin akışı başlamadan ve her yeni
      karşılama mesajından önce ekrandaki açık bildirim balonu kapatılıyor.
      Böylece OO'daki gibi doğrulama kodu balonu kaybolunca sıradaki balon
      düşüyor; iki balon aynı anda üst üste binmiyor.
- [x] `a2PushToMesajlar` içine 4 sn dedupe guard'ı eklendi: aynı metin
      `sohbeto-welcome` thread'inde son 4 sn içinde varsa tekrar yazılmıyor.
      postMessage / listener iki kez tetiklense de Mesajlar uygulamasında
      çift kayıt oluşmuyor.

---

## Şimdi yapılacaklar (öncelik sırasıyla)

### 5) Kişiler — OO uyumlu kişi kartı
- [ ] Kişi satırına tıklayınca OO tarzı bilgi kartı (bottom-sheet ya da
      tam ekran) aç: avatar, isim, telefon, son görülme.
- [ ] Sesli arama butonu (mantık daha sonra; şimdilik arama ekranı stub).
- [ ] Görüntülü arama butonu (aynı şekilde stub).
- [ ] "Mesaj gönder" butonu → ilgili sohbet odasını aç.
- [ ] Düzenle / Sil aksiyonları.

### 5) Gruplar — grup kartı + üye listesi
- [ ] Grup kartına tıklayınca üye listesi sheet'i.
- [ ] Grup sohbeti odası (chatroom modu) ile entegrasyon.

### 6) Cilalama
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

## Bekleyen arayüzler

- [ ] sohbetoA3.html (planlama bekleniyor)
- [ ] sohbetoA4.html
- [ ] sohbetoA5.html
- [ ] sohbetoA6.html
- [ ] sohbetoA7.html
