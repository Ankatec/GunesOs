export type DeviceCategory = "phone" | "tablet" | "laptop" | "desktop";

export interface DeviceInfo {
  type: "phone" | "tablet" | "desktop"; // legacy compat
  category: DeviceCategory;
  brand: string;       // Ankatec (sabit marka)
  model: string;       // GunesOS.571 (sabit model)
  realBrand: string;   // gerçek tespit edilen marka (Samsung, Apple, ...)
  realModel: string;   // gerçek tespit edilen model
  emoji: string;
  label: string;       // Cihazım etiketi (kullanıcı isminden veya marka+modelden)
  typeLabel: string;   // "Masaüstü" / "Dizüstü" / "Tablet" / "Telefon"
  os: string;          // GüneşOS Ega
  realOs: string;      // gerçek OS
  screen: string;      // "1920 × 1080"
}

interface UAData {
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
    model?: string;
    platform?: string;
    platformVersion?: string;
    uaFullVersion?: string;
  }>;
}

let _cachedHighEntropy: { brand?: string; model?: string; os?: string } | null = null;

export async function refreshHighEntropyDeviceInfo(): Promise<void> {
  const ua = (navigator as unknown as { userAgentData?: UAData }).userAgentData;
  if (!ua?.getHighEntropyValues) return;
  try {
    const data = await ua.getHighEntropyValues(["model", "platform", "platformVersion", "architecture", "bitness"]);
    const browserBrand = ua.brands?.find((b) => !/Not.?A.?Brand/i.test(b.brand))?.brand;
    const osLabel = data.platform && data.platformVersion
      ? `${data.platform} ${data.platformVersion}`
      : data.platform;
    _cachedHighEntropy = { brand: browserBrand, model: data.model || undefined, os: osLabel };
  } catch { /* ignore */ }
}

function detectBrandModel(ua: string): { brand: string; model: string } {
  const samsung = ua.match(/;\s*(SM-\w+|GT-\w+|Galaxy[\s\w-]+)/i) || ua.match(/Samsung/i);
  if (samsung) return { brand: "Samsung", model: (samsung[1] || "Galaxy").replace(/_/g, " ").trim() };
  if (/iPhone/i.test(ua)) {
    const v = ua.match(/OS\s([\d_]+)/);
    return { brand: "Apple", model: v ? `iPhone (iOS ${v[1].replace(/_/g, ".")})` : "iPhone" };
  }
  if (/iPad/i.test(ua)) {
    const v = ua.match(/OS\s([\d_]+)/);
    return { brand: "Apple", model: v ? `iPad (iPadOS ${v[1].replace(/_/g, ".")})` : "iPad" };
  }
  if (/Huawei|HUAWEI/i.test(ua)) return { brand: "Huawei", model: "Huawei" };
  if (/Xiaomi|Redmi|POCO/i.test(ua)) return { brand: "Xiaomi", model: "Xiaomi" };
  if (/OnePlus/i.test(ua)) return { brand: "OnePlus", model: "OnePlus" };
  const pixel = ua.match(/Pixel\s?(\d+)/i);
  if (pixel) return { brand: "Google", model: `Pixel ${pixel[1]}` };
  const android = ua.match(/Android\s([\d.]+)/);
  if (android) return { brand: "Android", model: `Android ${android[1]}` };
  const win = ua.match(/Windows\sNT\s([\d.]+)/);
  if (win) {
    const map: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    return { brand: "Microsoft", model: `Windows ${map[win[1]] || win[1]}` };
  }
  const mac = ua.match(/Mac\sOS\sX\s([\d_]+)/);
  if (mac) return { brand: "Apple", model: `Mac (${mac[1].replace(/_/g, ".")})` };
  if (/Linux/i.test(ua)) return { brand: "Linux", model: "Linux PC" };
  return { brand: "Bilinmeyen", model: "Cihaz" };
}

function detectOS(ua: string): string {
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Bilinmeyen";
}

export function detectDevice(): DeviceInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { brand: realBrand, model: realModel } = detectBrandModel(ua);
  let realOs = detectOS(ua);
  if (_cachedHighEntropy?.os) realOs = _cachedHighEntropy.os;

  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const h = typeof window !== "undefined" ? window.innerHeight : 720;
  const sw = typeof window !== "undefined" ? window.screen?.width || w : w;
  const touch = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 1;

  const isMobile = /Android.*Mobile|iPhone|iPod|Windows Phone/i.test(ua);
  const isTablet = /iPad|Silk/i.test(ua) || (/Android/i.test(ua) && !isMobile);

  let category: DeviceCategory;
  let emoji: string;
  let typeLabel: string;
  if (isMobile) { category = "phone"; emoji = "📱"; typeLabel = "Telefon"; }
  else if (isTablet) { category = "tablet"; emoji = "📱"; typeLabel = "Tablet"; }
  else if (touch && sw <= 1700) { category = "laptop"; emoji = "💻"; typeLabel = "Dizüstü"; }
  else if (sw <= 1500) { category = "laptop"; emoji = "💻"; typeLabel = "Dizüstü"; }
  else { category = "desktop"; emoji = "🖥️"; typeLabel = "Masaüstü"; }

  const type: DeviceInfo["type"] = category === "phone" ? "phone" : category === "tablet" ? "tablet" : "desktop";
  const label = realBrand !== "Bilinmeyen" ? `${realBrand} ${realModel}` : typeLabel;

  return {
    type, category,
    brand: "Ankatec",
    model: "GunesOS.571",
    realBrand, realModel,
    emoji, label, typeLabel,
    os: "GüneşOS Ega",
    realOs,
    screen: `${w} × ${h}`,
  };
}
