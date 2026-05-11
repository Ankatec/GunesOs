/**
 * Yapayakıl Site Generator
 * Doğal dildeki istekten ("modern bir kahve sitesi yap, başlığı Mocha")
 * tam bir index.html üretir. Sunucusuz — sadece şablon + niyet ayrıştırma.
 */

export interface SiteIntent {
  isSiteRequest: boolean;
  title: string;
  tagline: string;
  theme: "dark" | "light" | "neon" | "warm";
  style: "modern" | "minimal" | "playful" | "luxury";
  sections: string[]; // ör. ["hero","features","cta","footer"]
  accent: string;     // hex
  category: string;   // ör. "kahve", "portfolyo", "restoran"
}

const SITE_TRIGGERS = /\b(site|sayfa|web ?sitesi|landing|portf?olyo|portfolio|blog|web)\b/i;
const MAKE_VERBS = /\b(yap|oluştur|hazırla|kur|tasarla|aç|build|create|make)\b/i;

const THEME_HINTS: Record<SiteIntent["theme"], RegExp> = {
  dark: /(koyu|dark|siyah|gece|karanlık)/i,
  light: /(açık|light|beyaz|aydınlık|temiz)/i,
  neon: /(neon|cyber|glow|parlak|fütüristik|futuristic)/i,
  warm: /(sıcak|warm|kahverengi|amber|sonbahar|pastel)/i,
};

const STYLE_HINTS: Record<SiteIntent["style"], RegExp> = {
  modern: /(modern|çağdaş|sade-modern)/i,
  minimal: /(minimal|sade|az|basit)/i,
  playful: /(eğlence|playful|renkli|canlı|çocuk)/i,
  luxury: /(lüks|luxury|premium|elit|şık)/i,
};

const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/(kahve|coffee|cafe)/i, "kahve"],
  [/(restoran|restaurant|yemek|menü)/i, "restoran"],
  [/(portf?olyo|portfolio|cv)/i, "portfolyo"],
  [/(blog|yazı|haber)/i, "blog"],
  [/(ajans|agency|stüdyo|studio)/i, "ajans"],
  [/(ürün|product|saas|uygulama|app)/i, "ürün"],
  [/(düğün|wedding|davetiye)/i, "düğün"],
  [/(spor|gym|fitness)/i, "fitness"],
];

const THEMES: Record<SiteIntent["theme"], { bg: string; bg2: string; fg: string; muted: string; accent: string; accent2: string }> = {
  dark:  { bg: "#0a0e1a", bg2: "#141a2e", fg: "#e6e9f2", muted: "#8b92a7", accent: "#7c5cff", accent2: "#4f9fff" },
  light: { bg: "#fafbfc", bg2: "#eef1f6", fg: "#0f172a", muted: "#475569", accent: "#3b82f6", accent2: "#06b6d4" },
  neon:  { bg: "#05060f", bg2: "#0c0f24", fg: "#e6f7ff", muted: "#7a87a8", accent: "#22d3ee", accent2: "#a855f7" },
  warm:  { bg: "#1a1410", bg2: "#2a2018", fg: "#f5ead8", muted: "#b8a890", accent: "#f59e0b", accent2: "#ef4444" },
};

function pickTitleFrom(text: string, category: string): string {
  // "başlığı X" / "ismi X" / "adı X" / "X isimli"
  const m =
    text.match(/(?:başlık(?:lı|ı)?|ad[ıi]|isim(?:li|i)?)\s*[:\-]?\s*["“]?([^\n"”]{2,40})["”]?/i) ||
    text.match(/["“]([^"”\n]{2,40})["”]/);
  if (m) return m[1].trim().replace(/[.,;]+$/, "");
  // varsayılan
  const defaults: Record<string, string> = {
    kahve: "Mocha & Co", restoran: "Lezzet Durağı", portfolyo: "Stüdyo", blog: "Günlük",
    ajans: "Atölye", ürün: "Lumen", düğün: "Sevgili", fitness: "Forma",
  };
  return defaults[category] || "Yeni Site";
}

export function parseIntent(text: string): SiteIntent {
  const isSiteRequest = SITE_TRIGGERS.test(text) && MAKE_VERBS.test(text);
  let theme: SiteIntent["theme"] = "dark";
  for (const [k, re] of Object.entries(THEME_HINTS)) if (re.test(text)) theme = k as any;
  let style: SiteIntent["style"] = "modern";
  for (const [k, re] of Object.entries(STYLE_HINTS)) if (re.test(text)) style = k as any;
  let category = "ürün";
  for (const [re, c] of CATEGORY_HINTS) if (re.test(text)) { category = c; break; }
  const title = pickTitleFrom(text, category);
  const palette = THEMES[theme];

  const taglines: Record<string, string> = {
    kahve: "Her yudum bir hikâye.",
    restoran: "Damağında iz bırakacak lezzetler.",
    portfolyo: "Seçilmiş işler, sade bir anlatım.",
    blog: "Düşüncelerin sakin köşesi.",
    ajans: "Marka, ürün ve deneyim tasarımı.",
    ürün: "Hızlı, modern ve odaklı.",
    düğün: "Birlikte yazdığımız ilk satır.",
    fitness: "Hedefine bir adım daha.",
  };

  return {
    isSiteRequest,
    title,
    tagline: taglines[category] || "Merhaba, dünya.",
    theme,
    style,
    sections: ["hero", "features", "cta", "footer"],
    accent: palette.accent,
    category,
  };
}

export function generateSite(intent: SiteIntent): string {
  const p = THEMES[intent.theme];
  const radius = intent.style === "minimal" ? "8px" : intent.style === "luxury" ? "4px" : "14px";
  const headingFont = intent.style === "luxury"
    ? `'Cormorant Garamond', Georgia, serif`
    : intent.style === "playful"
    ? `'Fraunces', Georgia, serif`
    : `'Inter', system-ui, -apple-system, sans-serif`;

  const features = featuresFor(intent.category);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(intent.title)} — ${escapeHtml(capitalize(intent.category))}</title>
  <meta name="description" content="${escapeHtml(intent.tagline)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;700&family=Fraunces:wght@500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    :root {
      --bg: ${p.bg}; --bg2: ${p.bg2}; --fg: ${p.fg}; --muted: ${p.muted};
      --accent: ${p.accent}; --accent2: ${p.accent2}; --radius: ${radius};
      --grad: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg); color: var(--fg); line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3 { font-family: ${headingFont}; line-height: 1.15; margin: 0 0 .4em; letter-spacing: -0.02em; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    header.site {
      position: sticky; top: 0; z-index: 10; backdrop-filter: blur(10px);
      background: color-mix(in oklab, var(--bg) 80%, transparent);
      border-bottom: 1px solid color-mix(in oklab, var(--fg) 8%, transparent);
    }
    header.site .row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 0;
    }
    .logo { font-weight: 700; font-size: 18px; }
    .logo span { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
    nav a { color: var(--muted); text-decoration: none; margin-left: 22px; font-size: 14px; transition: color .2s; }
    nav a:hover { color: var(--fg); }

    .hero {
      padding: 96px 0 80px; text-align: center;
      background: radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%);
    }
    .eyebrow {
      display: inline-block; padding: 6px 14px; border-radius: 999px;
      background: color-mix(in oklab, var(--accent) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--accent) 30%, transparent);
      color: var(--accent); font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
      margin-bottom: 20px;
    }
    .hero h1 { font-size: clamp(40px, 7vw, 76px); font-weight: 700; }
    .hero h1 em {
      font-style: normal; background: var(--grad);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .hero p { color: var(--muted); font-size: 18px; max-width: 560px; margin: 18px auto 32px; }

    .btn {
      display: inline-block; padding: 14px 28px; border-radius: var(--radius);
      background: var(--grad); color: white; text-decoration: none;
      font-weight: 600; font-size: 15px; border: 0; cursor: pointer;
      box-shadow: 0 14px 40px -12px color-mix(in oklab, var(--accent) 60%, transparent);
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 20px 50px -12px color-mix(in oklab, var(--accent) 70%, transparent); }
    .btn.ghost {
      background: transparent; color: var(--fg);
      border: 1px solid color-mix(in oklab, var(--fg) 20%, transparent);
      box-shadow: none; margin-left: 10px;
    }

    section.features { padding: 80px 0; }
    section.features h2 { font-size: clamp(28px, 4vw, 40px); text-align: center; margin-bottom: 14px; }
    section.features .lead { color: var(--muted); text-align: center; max-width: 520px; margin: 0 auto 50px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .card {
      padding: 28px; border-radius: var(--radius);
      background: var(--bg2);
      border: 1px solid color-mix(in oklab, var(--fg) 6%, transparent);
      transition: transform .25s ease, border-color .25s ease;
    }
    .card:hover { transform: translateY(-4px); border-color: color-mix(in oklab, var(--accent) 40%, transparent); }
    .card .ico {
      width: 44px; height: 44px; border-radius: 12px;
      background: var(--grad); display: grid; place-items: center;
      color: white; font-size: 20px; margin-bottom: 16px;
    }
    .card h3 { font-size: 18px; font-family: 'Inter', sans-serif; }
    .card p { color: var(--muted); font-size: 14px; margin: 0; }

    section.cta {
      padding: 80px 24px; text-align: center;
      margin: 40px auto; max-width: 1052px; border-radius: calc(var(--radius) * 1.5);
      background: var(--bg2);
      border: 1px solid color-mix(in oklab, var(--accent) 25%, transparent);
      position: relative; overflow: hidden;
    }
    section.cta::before {
      content: ""; position: absolute; inset: -2px;
      background: var(--grad); opacity: .06; z-index: 0;
    }
    section.cta > * { position: relative; z-index: 1; }
    section.cta h2 { font-size: clamp(28px, 4vw, 42px); }
    section.cta p { color: var(--muted); max-width: 460px; margin: 12px auto 28px; }

    footer.site {
      padding: 40px 0; text-align: center; color: var(--muted); font-size: 13px;
      border-top: 1px solid color-mix(in oklab, var(--fg) 6%, transparent);
    }
  </style>
</head>
<body>
  <header class="site">
    <div class="wrap row">
      <div class="logo"><span>${escapeHtml(intent.title)}</span></div>
      <nav>
        <a href="#features">Özellikler</a>
        <a href="#cta">Başla</a>
        <a href="#contact">İletişim</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="wrap">
      <span class="eyebrow">${escapeHtml(intent.style)} · ${escapeHtml(intent.category)}</span>
      <h1>${escapeHtml(intent.title)} <em>için</em><br/>${escapeHtml(intent.tagline)}</h1>
      <p>Yapayakıl tarafından üretildi. İçeriği, renkleri ve bölümleri bana yazarak değiştirebilirsin.</p>
      <a class="btn" href="#cta">Hemen Başla</a>
      <a class="btn ghost" href="#features">Daha Fazla</a>
    </div>
  </section>

  <section class="features" id="features">
    <div class="wrap">
      <h2>Neler sunuyoruz?</h2>
      <p class="lead">${escapeHtml(intent.title)} ile öne çıkan üç değer:</p>
      <div class="grid">
        ${features.map(f => `
        <div class="card">
          <div class="ico">${f.icon}</div>
          <h3>${escapeHtml(f.title)}</h3>
          <p>${escapeHtml(f.desc)}</p>
        </div>`).join("")}
      </div>
    </div>
  </section>

  <section class="cta" id="cta">
    <h2>Hazır mısın?</h2>
    <p>Bugün başla, ${escapeHtml(intent.title)} dünyasının bir parçası ol.</p>
    <a class="btn" href="#" onclick="alert('Teşekkürler! 🎉'); return false;">Şimdi Katıl</a>
  </section>

  <footer class="site" id="contact">
    <div class="wrap">© ${new Date().getFullYear()} ${escapeHtml(intent.title)} · Yapayakıl ile üretildi</div>
  </footer>
</body>
</html>`;
}

function featuresFor(cat: string): Array<{ icon: string; title: string; desc: string }> {
  const map: Record<string, Array<{ icon: string; title: string; desc: string }>> = {
    kahve: [
      { icon: "☕", title: "Tek Çekirdek", desc: "Doğrudan üreticiden, taze çekilmiş kahve." },
      { icon: "🌱", title: "Sürdürülebilir", desc: "Adil ticaret ve organik sertifikalı." },
      { icon: "🏠", title: "Sıcak Atmosfer", desc: "Çalışmak ve sohbet etmek için ideal alan." },
    ],
    restoran: [
      { icon: "🍽️", title: "Mevsim Menüsü", desc: "Her ay yenilenen taze ürünler." },
      { icon: "👨‍🍳", title: "Şef Seçimi", desc: "Özenle hazırlanan imza tabakları." },
      { icon: "🍷", title: "Eşleştirme", desc: "Her tabağa uygun şarap ve içecek önerisi." },
    ],
    portfolyo: [
      { icon: "🎨", title: "Seçilmiş İşler", desc: "En iyi projelerimden bir derleme." },
      { icon: "🛠️", title: "Süreç", desc: "Fikirden teslime kadar şeffaf çalışma." },
      { icon: "💬", title: "İletişim", desc: "Yeni projeler için bana yazabilirsin." },
    ],
    blog: [
      { icon: "✍️", title: "Düzenli Yazılar", desc: "Haftada bir yeni içerik." },
      { icon: "📚", title: "Derinlemesine", desc: "Konuları sade ama detaylı anlatım." },
      { icon: "💌", title: "Bülten", desc: "Yeni yazılar e-posta kutuna düşsün." },
    ],
    ajans: [
      { icon: "🚀", title: "Strateji", desc: "Marka ve ürün için net yol haritası." },
      { icon: "🎯", title: "Tasarım", desc: "İz bırakan görsel kimlik ve arayüz." },
      { icon: "📈", title: "Büyüme", desc: "Ölçülebilir sonuçlar üreten kampanyalar." },
    ],
    ürün: [
      { icon: "⚡", title: "Hızlı", desc: "İlk yüklemede saniyenin altında." },
      { icon: "🔒", title: "Güvenli", desc: "End-to-end şifreleme ile koruma." },
      { icon: "🎯", title: "Odaklı", desc: "Sadece gerçekten ihtiyacın olan özellikler." },
    ],
    düğün: [
      { icon: "💍", title: "Hikâyemiz", desc: "Bizi buluşturan o anlar." },
      { icon: "📅", title: "Tarih & Yer", desc: "Tüm program ve mekan bilgileri." },
      { icon: "💌", title: "RSVP", desc: "Katılım onayını kolayca gönder." },
    ],
    fitness: [
      { icon: "🏋️", title: "Antrenman", desc: "Hedefe özel program." },
      { icon: "🥗", title: "Beslenme", desc: "Sürdürülebilir ve dengeli plan." },
      { icon: "📊", title: "Takip", desc: "İlerlemeni haftalık raporla gör." },
    ],
  };
  return map[cat] || map.ürün;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
