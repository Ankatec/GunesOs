// Sepete eklenmiş ekstra 34 uygulama (yapım aşamasında).
export interface ExtraApp {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  gradient: string;
}

export const EXTRA_APPS: ExtraApp[] = [
  { id: "calculator", label: "Hesap", emoji: "🧮", desc: "Akıllı hesap makinesi geliyor.", gradient: "bg-gradient-to-b from-slate-50 to-slate-100" },
  { id: "clock", label: "Saat", emoji: "⏰", desc: "Dünya saatleri hazırlanıyor.", gradient: "bg-gradient-to-b from-sky-50 to-sky-100" },
  { id: "calendar", label: "Takvim", emoji: "📅", desc: "Ajanda yakında kullanıma açılacak.", gradient: "bg-gradient-to-b from-rose-50 to-rose-100" },
  { id: "weather", label: "Hava", emoji: "🌦️", desc: "Hava durumu servisi geliyor.", gradient: "bg-gradient-to-b from-cyan-50 to-cyan-100" },
  { id: "camera", label: "Kamera", emoji: "📷", desc: "Kamera modülü hazırlanıyor.", gradient: "bg-gradient-to-b from-zinc-50 to-zinc-100" },
  { id: "photos", label: "Fotoğraf", emoji: "🖼️", desc: "Galeri yakında.", gradient: "bg-gradient-to-b from-amber-50 to-amber-100" },
  { id: "video", label: "Video", emoji: "🎥", desc: "Video oynatıcı geliyor.", gradient: "bg-gradient-to-b from-red-50 to-red-100" },
  { id: "podcast", label: "Podcast", emoji: "🎙️", desc: "Podcast bölümleri yolda.", gradient: "bg-gradient-to-b from-purple-50 to-purple-100" },
  { id: "news", label: "Haber", emoji: "📰", desc: "Haber akışı hazırlanıyor.", gradient: "bg-gradient-to-b from-stone-50 to-stone-100" },
  { id: "maps", label: "Haritalar", emoji: "🗺️", desc: "Harita servisi geliyor.", gradient: "bg-gradient-to-b from-emerald-50 to-emerald-100" },
  { id: "translate", label: "Çeviri", emoji: "🌐", desc: "Çevirmen aracı yakında.", gradient: "bg-gradient-to-b from-blue-50 to-blue-100" },
  { id: "dictionary", label: "Sözlük", emoji: "📖", desc: "Sözlük yakında.", gradient: "bg-gradient-to-b from-indigo-50 to-indigo-100" },
  { id: "encyclopedia", label: "Ansiklopedi", emoji: "📚", desc: "Bilgi kütüphanesi geliyor.", gradient: "bg-gradient-to-b from-teal-50 to-teal-100" },
  { id: "library", label: "Kütüphane", emoji: "🏛️", desc: "Dijital kütüphane geliyor.", gradient: "bg-gradient-to-b from-yellow-50 to-yellow-100" },
  { id: "ebooks", label: "E-Kitap", emoji: "📕", desc: "E-Kitap okuyucu yakında.", gradient: "bg-gradient-to-b from-orange-50 to-orange-100" },
  { id: "market", label: "Market", emoji: "🛒", desc: "Uygulama mağazası yakında.", gradient: "bg-gradient-to-b from-lime-50 to-lime-100" },
  { id: "bank", label: "Banka", emoji: "🏦", desc: "Bankacılık modülü hazırlanıyor.", gradient: "bg-gradient-to-b from-green-50 to-green-100" },
  { id: "wallet", label: "Cüzdan", emoji: "👛", desc: "Cüzdan yakında.", gradient: "bg-gradient-to-b from-fuchsia-50 to-fuchsia-100" },
  { id: "qrscan", label: "QR", emoji: "🔳", desc: "QR tarayıcı geliyor.", gradient: "bg-gradient-to-b from-neutral-50 to-neutral-100" },
  { id: "scanner", label: "Tarayıcı", emoji: "🖨️", desc: "Belge tarayıcı yakında.", gradient: "bg-gradient-to-b from-gray-50 to-gray-100" },
  { id: "voice", label: "Ses Asist.", emoji: "🎤", desc: "Sesli asistan geliyor.", gradient: "bg-gradient-to-b from-pink-50 to-pink-100" },
  { id: "recorder", label: "Kayıt", emoji: "🔴", desc: "Ses kaydedici yakında.", gradient: "bg-gradient-to-b from-red-50 to-red-100" },
  { id: "alarm", label: "Alarm", emoji: "🔔", desc: "Alarm uygulaması geliyor.", gradient: "bg-gradient-to-b from-amber-50 to-amber-100" },
  { id: "timer", label: "Zaman.", emoji: "⏲️", desc: "Zamanlayıcı yakında.", gradient: "bg-gradient-to-b from-orange-50 to-orange-100" },
  { id: "stopwatch", label: "Krono", emoji: "⏱️", desc: "Kronometre geliyor.", gradient: "bg-gradient-to-b from-yellow-50 to-yellow-100" },
  { id: "todo", label: "Yapılacak", emoji: "✅", desc: "Görev listesi yakında.", gradient: "bg-gradient-to-b from-green-50 to-green-100" },
  { id: "reminder", label: "Hatırlat.", emoji: "📌", desc: "Hatırlatıcı geliyor.", gradient: "bg-gradient-to-b from-rose-50 to-rose-100" },
  { id: "budget", label: "Bütçe", emoji: "💰", desc: "Bütçe takibi yakında.", gradient: "bg-gradient-to-b from-emerald-50 to-emerald-100" },
  { id: "fitness", label: "Fitness", emoji: "💪", desc: "Spor takip yakında.", gradient: "bg-gradient-to-b from-orange-50 to-orange-100" },
  { id: "health", label: "Sağlık", emoji: "❤️", desc: "Sağlık uygulaması geliyor.", gradient: "bg-gradient-to-b from-red-50 to-red-100" },
  { id: "recipe", label: "Tarifler", emoji: "🍲", desc: "Yemek tarifleri yakında.", gradient: "bg-gradient-to-b from-amber-50 to-amber-100" },
  { id: "garden", label: "Bahçe", emoji: "🌱", desc: "Bahçe rehberi geliyor.", gradient: "bg-gradient-to-b from-lime-50 to-lime-100" },
  { id: "travel", label: "Seyahat", emoji: "✈️", desc: "Seyahat planlayıcı yakında.", gradient: "bg-gradient-to-b from-sky-50 to-sky-100" },
  { id: "ticket", label: "Bilet", emoji: "🎫", desc: "Bilet alma modülü geliyor.", gradient: "bg-gradient-to-b from-violet-50 to-violet-100" },
];

export const EXTRA_APP_MAP: Record<string, ExtraApp> = Object.fromEntries(
  EXTRA_APPS.map((a) => [a.id, a])
);
