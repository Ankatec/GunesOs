# GüneşOS — PWA & TWA Kurulum Notları

GüneşOS tam teşekküllü bir Progressive Web App (PWA) olarak çalışır ve
Trusted Web Activity (TWA) ile Google Play'e yüklenmeye hazırdır.

## PWA Özellikleri

- **Manifest**: `public/manifest.json` — name, shortcuts, share_target, protocol_handlers, launch_handler
- **İkonlar**: 72→512 hem `any` hem `maskable` (`public/icons/`)
- **Service Worker**: `public/sw.js`
  - HTML için NetworkFirst (3sn timeout) → cache → `offline.html`
  - JS/CSS için StaleWhileRevalidate
  - Resim/font için CacheFirst (60 gün)
- **Offline fallback**: `public/offline.html`
- **Update toast**: yeni sürüm geldiğinde sonner bildirimi + "Yenile" aksiyonu
- **İzin onboarding**: ilk açılışta bildirim, konum, kamera/mic, persistent storage,
  rehber, dosya sistemi izinleri tek tek istenir
- **Install prompt**: 30sn sonra şık bottom-sheet; iOS Safari için görsel rehber;
  reddedilirse 7 gün tekrar sorulmaz
- **Standalone modunda** custom mobil nav bar gizlenir, sistem geri/home/recents
  `useHistoryNav` üzerinden GüneşOS pencerelerini yönetir

## Lovable Preview Davranışı

Service worker yalnızca **production build**'de aktif olur.
Preview iframe ve `id-preview--*.lovable.app`, `lovableproject.com`, `lovable.app`
host'larında veya dev modunda kayıt **yapılmaz** ve mevcut SW kayıtları temizlenir.
Bu sayede preview'da stale cache problemi yaşanmaz.

## TWA (Android Play Store) Hazırlığı

1. **Asset Links**: `public/.well-known/assetlinks.json` dosyasındaki
   `REPLACE_WITH_SHA256_FINGERPRINT_OF_YOUR_SIGNING_KEY` placeholder'ını
   gerçek imzalama anahtarın SHA256 fingerprint'i ile değiştir.

   Fingerprint'i almak için:
   ```bash
   keytool -list -v -keystore ~/upload-key.keystore -alias upload | grep SHA256
   ```

2. **Bubblewrap ile TWA üret**:
   ```bash
   npx @bubblewrap/cli init --manifest=https://gunesos.app/manifest.json
   npx @bubblewrap/cli build
   ```

3. Bubblewrap çıktısı olan `.aab` dosyasını Google Play Console'a yükle.

4. TWA başarılı doğrulanırsa Android cihazda **adres çubuğu olmadan** tam ekran açılır.

## Lighthouse PWA Skoru

Aşağıdakiler tamam:
- ✅ HTTPS (deploy ortamında)
- ✅ Valid manifest + theme_color + maskable icon
- ✅ 192 ve 512 ikon
- ✅ apple-touch-icon
- ✅ viewport meta
- ✅ Service worker + offline fallback

## Klasör Yapısı

```
src/pwa/
  ├─ serviceWorkerRegistration.ts   # SW kayıt + update toast + iframe guard
  ├─ InstallSheet.tsx                # 30sn sonra bottom-sheet install promptu
  └─ PermissionsOnboarding.tsx       # Adım adım izin akışı

public/
  ├─ manifest.json
  ├─ sw.js
  ├─ offline.html
  ├─ icons/                          # 72→512 + maskable + apple-touch-icon
  └─ .well-known/assetlinks.json     # TWA için
```
