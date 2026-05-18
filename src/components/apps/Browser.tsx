import React, { useState } from "react";

interface Tab {
  id: string;
  title: string;
  url: string;
}

interface DomainItem {
  name: string;
  extension: string;
  price: string;
  available: boolean;
}

const domainExtensions = [".osmanlı", ".ay", ".hilal", ".türk", ".yıldız"];

const BrowserApp: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: "1", title: "Ana Sayfa", url: "ega://anasayfa" }]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [addressInput, setAddressInput] = useState("ega://anasayfa");
  const [searchQuery, setSearchQuery] = useState("");
  const [domainSearch, setDomainSearch] = useState("");
  const [domainResults, setDomainResults] = useState<DomainItem[]>([]);
  const [cart, setCart] = useState<DomainItem[]>([]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const getPageTitle = (url: string) => {
    if (url === "ega://anasayfa") return "Ana Sayfa";
    if (url === "ega://alanadi") return "Alan Adı Al";
    if (url.startsWith("ega://ara/")) return `Arama: ${url.replace("ega://ara/", "")}`;
    return url;
  };

  const navigate = (url: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url, title: getPageTitle(url) } : t))
    );
    setAddressInput(url);
  };

  const addTab = () => {
    const id = Date.now().toString();
    setTabs((prev) => [...prev, { id, title: "Yeni Sekme", url: "ega://anasayfa" }]);
    setActiveTabId(id);
    setAddressInput("ega://anasayfa");
  };

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
      setAddressInput(newTabs[0].url);
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(addressInput);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`ega://ara/${searchQuery.trim()}`);
      setSearchQuery("");
    }
  };

  const searchDomains = () => {
    if (!domainSearch.trim()) return;
    const results = domainExtensions.map((ext) => ({
      name: domainSearch.trim().toLowerCase(),
      extension: ext,
      price: `${Math.floor(Math.random() * 200 + 50)}₺/yıl`,
      available: Math.random() > 0.3,
    }));
    setDomainResults(results);
  };

  const addToCart = (domain: DomainItem) => {
    if (!cart.find((d) => d.name === domain.name && d.extension === domain.extension)) {
      setCart((prev) => [...prev, domain]);
    }
  };

  const shortcuts = [
    { label: "Haberler", url: "ega://haberler", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 4v4h4" },
    { label: "Oyunlar", url: "ega://oyunlar", icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" },
    { label: "E-Posta", url: "ega://eposta", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { label: "Arama", url: "", icon: "M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Alan Adı", url: "ega://alanadi", icon: "M12 11c0 3.517-1.009 6.799-2.753 9.571M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Hakkında", url: "ega://hakkinda", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const renderHomePage = () => (
    <div className="relative w-full h-full bg-[#0d0d12] overflow-auto flex flex-col items-center justify-center py-8 px-4">
      {/* Ottoman pattern overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}
      />

      {/* Logo */}
      <div className="relative mb-10">
        <div className="absolute -inset-16 bg-[#D4AF37] opacity-5 blur-[80px] rounded-full" />
        <div className="flex flex-col items-center relative">
          <div className="relative w-20 h-20 mb-5">
            <div className="absolute inset-0 border border-[#D4AF37]/30 rounded-full" />
            <div className="absolute inset-1.5 border-2 border-[#D4AF37] rounded-full border-dotted" />
            <div className="absolute inset-4 bg-gradient-to-tr from-[#D4AF37] to-[#f7e4a1] rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border border-[#D4AF37] rotate-45 flex items-center justify-center">
                  <div className="w-6 h-6 border border-[#D4AF37] -rotate-45" />
                </div>
              </div>
            </div>
          </div>
          <h1
            className={`font-bold text-white tracking-widest ${isMobile ? "text-2xl" : "text-3xl"}`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            EGA <span className="text-[#D4AF37]">Tarayıcı</span>
          </h1>
        </div>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className={`w-full px-2 relative mb-10 ${isMobile ? "max-w-full" : "max-w-xl"}`}
      >
        <div className="relative bg-[#1a1a20] border border-white/10 rounded-2xl flex items-center overflow-hidden shadow-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İmparatorluk içinde ara..."
            className="w-full bg-transparent px-5 py-4 text-base text-white placeholder:text-white/25 outline-none"
          />
          <div className="p-2 mr-1">
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-br from-[#D4AF37] to-[#8b0000] rounded-xl hover:brightness-110 transition-all active:scale-95"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {/* Shortcuts */}
      <div className={`grid gap-3 px-2 w-full ${isMobile ? "grid-cols-3 max-w-md" : "grid-cols-6 max-w-3xl"}`}>
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={() => s.url && navigate(s.url)}
            className="group cursor-pointer"
          >
            <div className="h-20 bg-white/[0.03] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#8b0000]/15 hover:border-[#D4AF37]/30 transition-all duration-200">
              <div className="text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                </svg>
              </div>
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/45 group-hover:text-white">
                {s.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Domain badges */}
      <div className="mt-10 flex flex-wrap justify-center gap-5 text-[9px] uppercase tracking-[0.2em] font-medium text-white/25">
        {domainExtensions.map((d) => (
          <span key={d} className="hover:text-[#D4AF37] cursor-default transition-colors">
            {d}
          </span>
        ))}
      </div>
    </div>
  );

  const renderDomainPage = () => (
    <div className="w-full h-full bg-[#0d0d12] text-white overflow-auto p-5">
      <h2 className="text-xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
        Alan Adı Satın Al
      </h2>
      <p className="text-sm text-white/50 mb-5">Özel Türk uzantılarıyla alan adınızı alın.</p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={domainSearch}
          onChange={(e) => setDomainSearch(e.target.value)}
          placeholder="Alan adı ara... (örn: benim-sitem)"
          className="flex-1 px-4 py-2.5 bg-[#1a1a20] border border-white/10 rounded-lg text-sm outline-none focus:border-[#D4AF37]/50 text-white placeholder:text-white/30"
          onKeyDown={(e) => e.key === "Enter" && searchDomains()}
        />
        <button
          onClick={searchDomains}
          className="px-5 py-2.5 bg-gradient-to-br from-[#D4AF37] to-[#8b0000] text-white text-sm font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all uppercase tracking-wider"
        >
          Ara
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {domainExtensions.map((ext) => (
          <span
            key={ext}
            className="px-2.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] rounded-full font-bold uppercase tracking-wider"
          >
            {ext}
          </span>
        ))}
      </div>

      {domainResults.length > 0 && (
        <div className="space-y-2 mb-5">
          {domainResults.map((d, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                d.available
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <div>
                <span className="font-medium text-sm text-white">
                  {d.name}
                  {d.extension}
                </span>
                <span className={`ml-2 text-xs ${d.available ? "text-emerald-400" : "text-red-400"}`}>
                  {d.available ? "✓ Müsait" : "✕ Alınmış"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#D4AF37]">{d.price}</span>
                {d.available && (
                  <button
                    onClick={() => addToCart(d)}
                    className="px-2.5 py-1 bg-[#D4AF37] text-black text-[10px] rounded font-bold uppercase tracking-wider hover:brightness-110"
                  >
                    + Sepet
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <h3 className="font-bold text-sm mb-2 text-[#D4AF37] uppercase tracking-wider">
            Sepet ({cart.length})
          </h3>
          {cart.map((d, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 text-sm text-white">
              <span>
                {d.name}
                {d.extension}
              </span>
              <span className="font-bold text-[#D4AF37]">{d.price}</span>
            </div>
          ))}
          <button className="mt-3 w-full py-2.5 bg-gradient-to-br from-[#D4AF37] to-[#8b0000] text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
            Satın Al
          </button>
        </div>
      )}
    </div>
  );

  const renderSearchResults = (query: string) => (
    <div className="w-full h-full bg-[#0d0d12] text-white overflow-auto p-5">
      <h2 className="text-base font-bold mb-4 text-white/80">
        <span className="text-[#D4AF37]">&quot;{query}&quot;</span> için arama sonuçları
      </h2>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="mb-4 border-b border-white/5 pb-3">
          <a href="#" className="text-[#D4AF37] text-sm font-medium hover:underline">
            {query} - Sonuç {i}
          </a>
          <p className="text-[11px] text-emerald-400/70">
            ega://{query.toLowerCase().replace(/\s/g, "-")}-{i}.osmanlı
          </p>
          <p className="text-xs text-white/50 mt-1">
            Bu, &quot;{query}&quot; araması için örnek bir sonuçtur.
          </p>
        </div>
      ))}
    </div>
  );

  const getPageContent = () => {
    const url = activeTab.url;
    if (url === "ega://anasayfa") return renderHomePage();
    if (url === "ega://alanadi") return renderDomainPage();
    if (url.startsWith("ega://ara/")) return renderSearchResults(url.replace("ega://ara/", ""));
    if (url === "ega://hakkinda") {
      return (
        <div className="w-full h-full bg-[#0d0d12] text-white p-6">
          <h2 className="text-xl font-bold text-[#D4AF37] mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
            EGA Tarayıcı Hakkında
          </h2>
          <p className="text-sm text-white/70">Sürüm: 1.0</p>
          <p className="text-sm text-white/70">Protokol: ega://</p>
          <p className="text-sm text-white/50 mt-2">© 2026 GüneşOS. Tüm hakları saklıdır.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d0d12] p-8">
        <span className="text-4xl mb-4">🌐</span>
        <h2 className="text-lg font-bold text-white/80 mb-2">Sayfa Bulunamadı</h2>
        <p className="text-sm text-white/50 text-center">&quot;{url}&quot; adresine ulaşılamıyor.</p>
        <button
          className="mt-4 px-5 py-2 bg-gradient-to-br from-[#D4AF37] to-[#8b0000] text-white text-sm rounded-lg font-bold uppercase tracking-wider hover:brightness-110"
          onClick={() => navigate("ega://anasayfa")}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#121216]">
      {/* Tab Bar */}
      <div className="h-10 bg-[#1a1a20] flex items-end px-2 gap-1 border-b border-white/5 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-t-lg cursor-pointer max-w-[160px] shrink-0 transition-colors ${
              tab.id === activeTabId
                ? "bg-[#25252e] border border-white/10 border-b-0 text-white/90"
                : "text-white/40 hover:text-white/70"
            }`}
            onClick={() => {
              setActiveTabId(tab.id);
              setAddressInput(tab.url);
            }}
          >
            {tab.id === activeTabId && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
            )}
            <span className="truncate font-medium">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                className="ml-1 text-white/40 hover:text-[#8b0000]"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          className="w-6 h-6 mb-1 text-white/40 hover:text-[#D4AF37] hover:bg-white/5 rounded flex items-center justify-center shrink-0 transition-colors"
          onClick={addTab}
        >
          +
        </button>
      </div>

      {/* Address Bar */}
      <form
        onSubmit={handleAddressSubmit}
        className="h-12 bg-[#16161c] border-b border-white/5 flex items-center px-3 gap-2"
      >
        <button
          type="button"
          className="text-white/40 hover:text-[#D4AF37] p-1.5 rounded transition-colors shrink-0"
          onClick={() => navigate("ega://anasayfa")}
          title="Ana Sayfa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
        <button
          type="button"
          className="text-white/40 hover:text-[#D4AF37] p-1.5 rounded transition-colors shrink-0"
          onClick={() => navigate("ega://alanadi")}
          title="Alan Adı"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <div className="flex-1 flex items-center bg-black/40 border border-white/5 rounded-full px-4 py-1.5 focus-within:border-[#D4AF37]/50 transition-all min-w-0">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="flex-1 text-[12px] bg-transparent outline-none text-white/90 min-w-0"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 bg-[#8b0000] hover:bg-[#a00000] text-white text-[10px] font-bold rounded-full transition-colors shadow-lg shadow-[#8b0000]/20 uppercase tracking-widest shrink-0"
        >
          Git
        </button>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{getPageContent()}</div>

      {/* Status Bar */}
      <div className="h-5 bg-[#1a1a20] border-t border-white/5 flex items-center px-3">
        <span className="text-[9px] text-white/30 uppercase tracking-widest">Hazır · ega://</span>
      </div>
    </div>
  );
};

export default BrowserApp;
