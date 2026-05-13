import { useEffect, useRef } from "react";

/**
 * GüneşOS için tarayıcı/PWA geri tuşu entegrasyonu.
 *
 * Mantık:
 * - Her "geri-alınabilir katman" (her açık pencere + açıksa son uygulamalar overlay'i)
 *   tarayıcı history stack'inde 1 entry'ye karşılık gelir.
 * - Kullanıcı telefonun ya da tarayıcının kendi geri tuşuna bastığında `popstate`
 *   tetiklenir, biz de en üstteki katmanı kapatırız (önce recents, sonra top window).
 * - Kullanıcı uygulama içinden bir pencere/recents kapattığında biz de history'yi
 *   senkron tutmak için `history.go(-n)` yaparız; bunu kendi tetiklediğimizi
 *   anlamak için ignoreNextPop sayacı kullanırız.
 *
 * Bu sayede:
 * - PWA standalone modda Android sistem geri tuşu uygulama içinde "geri" davranır,
 *   sadece en son katman kalktığında PWA'dan çıkar.
 * - Tarayıcı sekmesinde de aynı şekilde tarayıcının geri tuşu uygulama içi
 *   navigasyonu yönetir, yanlışlıkla siteden çıkış olmaz.
 */
export function useHistoryNav(params: {
  /** Aktif geri-alınabilir katman sayısı (windows.length + (recentsOpen?1:0)) */
  depth: number;
  /** Sistem/native geri basıldığında çağrılır, true dönerse 1 katman kapatılmış sayılır */
  onBack: () => void;
}) {
  const { depth, onBack } = params;
  const currentDepth = useRef(0);
  const ignorePops = useRef(0);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // popstate dinleyicisi — sadece bir kez kurulur
  useEffect(() => {
    const handler = () => {
      if (ignorePops.current > 0) {
        ignorePops.current -= 1;
        return;
      }
      // Kullanıcı / sistem geri bastı: bir katman kapat
      if (currentDepth.current > 0) {
        currentDepth.current -= 1;
        onBackRef.current();
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // depth değiştiğinde history stack'ini senkron tut
  useEffect(() => {
    if (typeof window === "undefined") return;
    const diff = depth - currentDepth.current;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        window.history.pushState({ gunesos: true, d: currentDepth.current + i + 1 }, "");
      }
      currentDepth.current = depth;
    } else if (diff < 0) {
      // Kendi tetiklediğimiz popstate'leri yok say
      ignorePops.current += -diff;
      currentDepth.current = depth;
      window.history.go(diff);
    }
  }, [depth]);
}
