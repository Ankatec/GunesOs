import React, { useState } from "react";

/**
 * Sohbeto: BASE_URL takes care of "/gunesos/" prefix on GitHub Pages and "/" in dev.
 *
 * Açılış akışı (Adım 11):
 *  - iframe'i KENDİ splash'ı (içerideki #screenSplash + "So" SVG) yönetir.
 *  - Önceden React tarafında ekstra bir splash overlay vardı ve iframe'i
 *    opacity:0 ile gizliyordu. Sonuç olarak yeni kullanıcılar iframe içindeki
 *    "So" ikonunu görmüyor; iframe görünür olduğunda splash zaten fade-out'a
 *    girmiş oluyordu. Bu yüzden React-level splash'ı kaldırdık.
 *  - iframe yüklenirken sadece koyu arkaplan + küçük bir "yükleniyor" gradient'i
 *    görünür, böylece beyaz/boş parlama olmaz; iframe açılır açılmaz kendi
 *    splash'ı + arkasından (yeni kullanıcı ise) tema seçici devreye girer.
 */
const Sohbeto: React.FC = () => {
  const src = `${import.meta.env.BASE_URL}apps/sohbetoOO.html`;
  const [iframeReady, setIframeReady] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#0e1621]">
      {!iframeReady && (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, #1a2638 0%, #0e1621 70%)",
          }}
        />
      )}
      <iframe
        title="Sohbeto"
        src={src}
        onLoad={() => setIframeReady(true)}
        className="relative w-full h-full border-0 bg-[#0e1621]"
        allow="camera; microphone; clipboard-write; clipboard-read; autoplay"
      />
    </div>
  );
};

export default Sohbeto;
