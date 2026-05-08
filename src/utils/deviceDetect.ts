export interface DeviceInfo {
  type: "phone" | "tablet" | "desktop";
  brand: string;
  model: string;
  emoji: string;
  label: string;
  os: string;
}

function detectBrandModel(ua: string): { brand: string; model: string } {
  // Samsung
  const samsungMatch = ua.match(/Samsung(?:Browser)?[/\s]([\w-]+)/i) ||
    ua.match(/;\s*(SM-\w+|GT-\w+|SCH-\w+|SGH-\w+|SPH-\w+|Galaxy[\s\w-]+)/i);
  if (samsungMatch) {
    const model = samsungMatch[1] || "Galaxy";
    return { brand: "Samsung", model: model.replace(/_/g, " ").trim() };
  }

  // iPhone
  const iphoneMatch = ua.match(/iPhone\d*,\d*|iPhone/i);
  if (iphoneMatch) {
    const iosMatch = ua.match(/OS\s([\d_]+)/);
    const iosVer = iosMatch ? iosMatch[1].replace(/_/g, ".") : "";
    return { brand: "Apple", model: iosVer ? `iPhone (iOS ${iosVer})` : "iPhone" };
  }

  // iPad
  const ipadMatch = ua.match(/iPad/i);
  if (ipadMatch) {
    const iosMatch = ua.match(/OS\s([\d_]+)/);
    const iosVer = iosMatch ? iosMatch[1].replace(/_/g, ".") : "";
    return { brand: "Apple", model: iosVer ? `iPad (iOS ${iosVer})` : "iPad" };
  }

  // Huawei
  const huaweiMatch = ua.match(/Huawei|HUAWEI|(?:;\s*)(ANA-\w+|VOG-\w+|ELE-\w+|TNY-\w+|MAR-\w+|POT-\w+|STK-\w+)/i);
  if (huaweiMatch) {
    const model = huaweiMatch[1] || "";
    return { brand: "Huawei", model: model ? model.replace(/_/g, " ") : "Huawei" };
  }

  // Xiaomi
  const xiaomiMatch = ua.match(/Xiaomi|Redmi|POCO|(?:;\s*)(M\d{4}\w*|Redmi[\s\w-]+)/i);
  if (xiaomiMatch) {
    const model = xiaomiMatch[1] || "";
    return { brand: "Xiaomi", model: model ? model.replace(/_/g, " ") : "Xiaomi" };
  }

  // OnePlus
  const oneplusMatch = ua.match(/OnePlus|(?:;\s*)(IN\d{4})/i);
  if (oneplusMatch) {
    const model = oneplusMatch[1] || "";
    return { brand: "OnePlus", model: model || "OnePlus" };
  }

  // Google Pixel
  const pixelMatch = ua.match(/Pixel\s?(\d+)/i);
  if (pixelMatch) {
    return { brand: "Google", model: `Pixel ${pixelMatch[1]}` };
  }

  // LG
  const lgMatch = ua.match(/LG|LGE|(?:;\s*)(LM-\w+)/i);
  if (lgMatch) {
    const model = lgMatch[1] || "";
    return { brand: "LG", model: model || "LG" };
  }

  // Sony
  const sonyMatch = ua.match(/Sony|Xperia|(?:;\s*)(SO-\w+|C\d{4})/i);
  if (sonyMatch) {
    const model = sonyMatch[1] || "";
    return { brand: "Sony", model: model ? `Xperia ${model}` : "Xperia" };
  }

  // General Android
  const androidMatch = ua.match(/Android\s([\d.]+)/);
  if (androidMatch) {
    return { brand: "Android", model: `Android ${androidMatch[1]}` };
  }

  // Windows
  const windowsMatch = ua.match(/Windows\sNT\s([\d.]+)/);
  if (windowsMatch) {
    const verMap: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    return { brand: "Microsoft", model: `Windows ${verMap[windowsMatch[1]] || windowsMatch[1]}` };
  }

  // Mac
  const macMatch = ua.match(/Mac\sOS\sX\s([\d_]+)/);
  if (macMatch) {
    return { brand: "Apple", model: `macOS ${macMatch[1].replace(/_/g, ".")}` };
  }

  // Linux
  if (ua.match(/Linux/i)) {
    return { brand: "Linux", model: "Linux" };
  }

  return { brand: "Bilinmeyen", model: "Cihaz" };
}

function detectOS(ua: string): string {
  if (ua.match(/Windows/i)) return "Windows";
  if (ua.match(/Mac OS X/i)) return "macOS";
  if (ua.match(/Android/i)) return "Android";
  if (ua.match(/iPhone|iPad|iPod/i)) return "iOS";
  if (ua.match(/Linux/i)) return "Linux";
  return "Bilinmeyen";
}

export function detectDevice(): DeviceInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { brand, model } = detectBrandModel(ua);
  const os = detectOS(ua);

  // Detect device type
  const isMobile = /Android.*Mobile|iPhone|iPod|Windows Phone/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)|Silk/i.test(ua) ||
    (typeof window !== "undefined" && window.innerWidth >= 640 && window.innerWidth < 1024 && isMobile === false && /Android/i.test(ua));

  let type: DeviceInfo["type"];
  let emoji: string;
  let label: string;

  if (isMobile) {
    type = "phone";
    emoji = "📱";
    label = brand !== "Bilinmeyen" ? `${brand} ${model}` : "Telefon";
  } else if (isTablet) {
    type = "tablet";
    emoji = "📱";
    label = brand !== "Bilinmeyen" ? `${brand} ${model}` : "Tablet";
  } else {
    type = "desktop";
    emoji = "🖥️";
    label = brand !== "Bilinmeyen" ? `${brand} ${model}` : "Bilgisayarım";
  }

  return { type, brand, model, emoji, label, os };
}