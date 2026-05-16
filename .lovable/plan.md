
Aşağıdaki sorunları sırayla, her adımdan sonra README'yi güncelleyerek çözeceğim. Engine.js'e dokunmamayı koruyacağım (gerekirse ayrı `sohbeto-adapter` ek modülü). Sadece zorunlu yerlerde küçük, geri alınabilir engine ekleri yapacağım ve önce sana bildireceğim.

## Adım 1 — Sohbet kimliği "telefon numarası" temelli olsun (duplicate fix)
Sorun: Aynı numara, isim değiştirince karşı tarafta yeni bir sohbet kutusu açıyor.
Çözüm:
- Adapter `renderConvList` köprüsünde sohbet kalemlerini **`connId` veya isim+numara** yerine yalnızca **normalize edilmiş telefon numarası** ile anahtarla.
- Mesaj geldiğinde `peer telefonu` → tek thread. İsim değişikliği sadece başlık/avatarı günceller, yeni satır yaratmaz.
- Mevcut localStorage'taki çift kayıtları tek seferlik migration ile birleştir.

## Adım 2 — Sohbetler gerçekten kalıcı olsun (tek kutu)
- Sohbet listesi + mesaj geçmişi `IndexedDB EgaNetwork_${tabId}` içinde **`thread:<+90...>`** anahtarıyla saklansın.
- Adapter, açılışta IDB'den okur ve `#convListOzel` stub'ına seed eder; engine canlı geldikçe merge eder.
- Aynı numaradan gelen tüm yeni mesajlar mutlaka aynı thread'e append edilir.

## Adım 3 — Gizlilik ayarı (Ayarlar modalına yeni "Gizlilik" bölümü)
- Ayarlar modalında **Gizlilik** sekmesi: "Adımı kişilerimde olmayanlara göster" (varsayılan: kapalı).
- Engine'in `LOOKUP_REPLY` / arama-bildirimi yolladığı yerde adapter köprüsü:
  - **Açık** → karşı tarafta "Abc seni arıyor" + numara
  - **Kapalı** → sadece numara (kişilerinde kayıtlıysa zaten kendi verdiği isim görünür)
- Tercih `localStorage: sohbeto_privacy_show_name_v1` (tab-id'siz değil, hesap-bazlı: `..._${myNumber}`).

## Adım 4 — Kişiler localStorage/IndexedDB'de kalıcı
- `contactsState`'i adapter `contacts:<myNumber>` anahtarıyla **IndexedDB**'ye yazsın (her `saveContact`/silme sonrası debounced flush).
- Açılışta engine boot olur olmaz IDB'den okuyup `contactsState`'e seed et, sonra `renderContacts()` çağır.

## Adım 5 — Ayarlar modalında geri dönüş bug'ı
- "Tema" / "Hesap" alt sayfalarına gidince Sohbetler/Kişiler/Gruplar nav'i tetiklenmiyor.
- Modal alt-route'unda `app.navigate(...)` çağrısı modali kapatmadığından nav onclick yutuluyor. Düzeltme: `nav-item` click'inde **önce** açık ayarlar alt-sayfasını kapat, sonra `showScreen` çağır. Geri butonuna da fallback ekle.

## Adım 6 — Açılış akışı: ikon → (kayıtlıysa) doğrudan Sohbetler
Mevcut: HTML mount olunca arayüz bir an görünüyor, sonra "kendi numarana mesaj" ekranı çıkıyor.
Çözüm:
- `Sohbeto.tsx` → iframe yüklenene kadar BootScreen tarzı **"So" ikonlu splash** göster (300–600ms).
- iframe içinde HTML başlangıçta `body` opacity 0; engine `boot:done` event atınca:
  - **myNumber varsa** → `screen-sohbetler`
  - **myNumber yoksa** → ileride arayüz seçim ekranı olacak yer için şimdilik `screen-phone`
- "Tekrar numarana mesaj" yan etkisi: kayıtlı kullanıcıda `screen-phone` dokunulmadan atlansın.

## Adım 7 — Arayüz seçimi iskeleti (ileri için yer açıyoruz)
- Splash sonrası `screen-theme-picker` placeholder ekranı (şimdilik tek seçenek: "OO" — auto-select).
- README'ye yeni tema ekleme adımına **"theme-picker'a kayıt"** maddesi eklenecek; ileride 5-6 tema gelince sadece bu picker'a item ekleyeceğiz.

## Adım 8 — README güncelle (KURAL)
Her adımdan sonra `public/apps/README.md` içine ne yapıldığını yaz:
- "Adım 7" başlığı altında thread-key, gizlilik, kalıcılık, splash + theme-picker sözleşmeleri.
- Yeni tema yazarken uyulacak yeni DOM ID'leri (`#screen-themepicker`, gizlilik toggle ID'leri).

## Teknik notlar (sana özet)
- Engine.js'e dokunmuyorum. Tüm değişiklik:
  - `public/apps/sohbeto-adapter.js` (mevcut adapter eklemeleri)
  - `public/apps/sohbetoOO.html` (privacy section, theme-picker placeholder, splash class)
  - `src/components/apps/Sohbeto.tsx` (React tarafı pre-iframe splash)
  - `public/apps/README.md` (sözleşme güncellemesi)
- Telefon normalize: `+90` öneki, sadece rakam; tüm key'ler için tek util.
- IDB store isimleri: `sohbeto_threads`, `sohbeto_contacts` (tab-id namespace'ine sadık, engine'in mevcut DB'sine paralel yeni store olarak açılacak — engine veritabanına dokunmuyoruz).

## Sıralama / risk
1, 2, 4 birlikte (en kritik veri kalıcılığı) → 5 (UX bug) → 3 (gizlilik) → 6, 7 (boot akışı) → 8 (README).
Her adım küçük commit gibi: bir bölgeyi değiştirip browser preview'de doğrulayacağım.

Onaylarsan **Adım 1'den başlıyorum**. Eğer önce belirli bir sorunu çözmemi istersen söyle, sırayı değiştireyim.
