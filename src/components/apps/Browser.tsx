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

  const renderHomePage = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-blue-50 to-white p-4">
      <h1 className={`font-bold text-[#000080] mb-4 ${isMobile ? "text-xl" : "text-2xl"}`}>
        🌞 EGA Tarayıcı
      </h1>

      <form onSubmit={handleSearch} className={`w-full mb-6 ${isMobile ? "max-w-full px-2" : "max-w-md"}`}>
        <div className="flex border-2 border-[#000080] rounded-lg overflow-hidden shadow-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara..."
            className="flex-1 px-3 py-2 text-sm outline-none text-black"
          />
          <button type="submit" className="px-4 bg-[#000080] text-white text-sm hover:bg-[#0000a0]">
            🔍
          </button>
        </div>
      </form>

      <div className={`grid gap-3 w-full ${isMobile ? "grid-cols-2 px-2" : "grid-cols-3 max-w-sm"}`}>
        {[
          { label: "📰 Haberler", url: "ega://haberler" },
          { label: "🎮 Oyunlar", url: "ega://oyunlar" },
          { label: "📧 E-Posta", url: "ega://eposta" },
          { label: "🔍 Arama", url: "" },
          { label: "🌍 Alan Adı Al", url: "ega://alanadi" },
          { label: "📖 Hakkında", url: "ega://hakkinda" },
        ].map((item) => (
          <button
            key={item.label}
            className="bg-white border border-gray-200 rounded-lg p-3 text-center text-sm hover:bg-blue-50 cursor-pointer shadow-sm hover:shadow-md transition-shadow text-black"
            onClick={() => {
              if (item.url) navigate(item.url);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDomainPage = () => (
    <div className={`p-4 overflow-auto h-full ${isMobile ? "p-2" : ""}`}>
      <h2 className="text-xl font-bold text-[#000080] mb-4">🌍 Alan Adı Satın Al</h2>
      <p className="text-sm text-gray-600 mb-4">Özel Türk uzantılarıyla alan adınızı alın!</p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={domainSearch}
          onChange={(e) => setDomainSearch(e.target.value)}
          placeholder="Alan adı ara... (örn: benim-sitem)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-[#000080] text-black"
          onKeyDown={(e) => e.key === "Enter" && searchDomains()}
        />
        <button
          onClick={searchDomains}
          className="px-4 py-2 bg-[#000080] text-white text-sm rounded hover:bg-[#0000a0]"
        >
          Ara
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {domainExtensions.map((ext) => (
          <span key={ext} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
            {ext}
          </span>
        ))}
      </div>

      {domainResults.length > 0 && (
        <div className="space-y-2 mb-4">
          {domainResults.map((d, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded border ${
                d.available ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div>
                <span className="font-medium text-sm text-black">
                  {d.name}
                  {d.extension}
                </span>
                <span className={`ml-2 text-xs ${d.available ? "text-green-600" : "text-red-600"}`}>
                  {d.available ? "✅ Müsait" : "❌ Alınmış"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-black">{d.price}</span>
                {d.available && (
                  <button
                    onClick={() => addToCart(d)}
                    className="px-2 py-1 bg-[#000080] text-white text-xs rounded hover:bg-[#0000a0]"
                  >
                    🛒 Sepete Ekle
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="border-t pt-3">
          <h3 className="font-bold text-sm mb-2 text-black">🛒 Sepet ({cart.length})</h3>
          {cart.map((d, i) => (
            <div key={i} className="flex justify-between items-center py-1 text-sm text-black">
              <span>
                {d.name}
                {d.extension}
              </span>
              <span className="font-bold">{d.price}</span>
            </div>
          ))}
          <button className="mt-2 w-full py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700">
            💳 Satın Al
          </button>
        </div>
      )}
    </div>
  );

  const renderSearchResults = (query: string) => (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3 text-black">🔍 &quot;{query}&quot; için arama sonuçları</h2>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="mb-4 border-b pb-3">
          <a href="#" className="text-blue-700 text-sm font-medium hover:underline">
            {query} - Sonuç {i}
          </a>
          <p className="text-[11px] text-green-700">
            ega://{query.toLowerCase().replace(/\s/g, "-")}-{i}.osmanlı
          </p>
          <p className="text-xs text-gray-600 mt-1">
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
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#000080] mb-3">EGA Tarayıcı Hakkında</h2>
          <p className="text-sm text-gray-700">Sürüm: 1.0</p>
          <p className="text-sm text-gray-700">Protokol: ega://</p>
          <p className="text-sm text-gray-700 mt-2">© 2026 GüneşOS. Tüm hakları saklıdır.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8">
        <span className="text-4xl mb-4">🌐</span>
        <h2 className="text-lg font-bold text-gray-700 mb-2">Sayfa Bulunamadı</h2>
        <p className="text-sm text-gray-500 text-center">&quot;{url}&quot; adresine ulaşılamıyor.</p>
        <button
          className="mt-4 px-4 py-1 bg-[#000080] text-white text-sm rounded hover:bg-[#0000a0]"
          onClick={() => navigate("ega://anasayfa")}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#e8e8e8]">
      <div className="flex items-center bg-[#d0d0d0] px-1 pt-1 gap-[2px] overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-t cursor-pointer max-w-[140px] shrink-0 ${
              tab.id === activeTabId
                ? "bg-white text-black border-t border-l border-r border-[#a0a0a0]"
                : "bg-[#c0c0c0] text-gray-600 hover:bg-[#d4d4d4]"
            }`}
            onClick={() => {
              setActiveTabId(tab.id);
              setAddressInput(tab.url);
            }}
          >
            <span className="truncate">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                className="ml-1 text-[10px] hover:text-red-500"
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
          className="w-5 h-5 text-[12px] text-gray-500 hover:text-black rounded flex items-center justify-center shrink-0"
          onClick={addTab}
        >
          +
        </button>
      </div>

      <form
        onSubmit={handleAddressSubmit}
        className="flex items-center gap-1 px-2 py-1 bg-white border-b border-[#a0a0a0]"
      >
        <button
          type="button"
          className="text-[14px] px-1 hover:bg-gray-100 rounded shrink-0"
          onClick={() => navigate("ega://anasayfa")}
        >
          🏠
        </button>
        <button
          type="button"
          className="text-[14px] px-1 hover:bg-gray-100 rounded shrink-0"
          onClick={() => navigate("ega://alanadi")}
        >
          🌍
        </button>
        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          className="flex-1 text-[12px] px-2 py-1 border border-gray-300 rounded bg-gray-50 outline-none focus:border-[#000080] min-w-0 text-black"
          spellCheck={false}
        />
        <button
          type="submit"
          className="text-[12px] px-2 py-1 bg-[#000080] text-white rounded hover:bg-[#0000a0] shrink-0"
        >
          Git
        </button>
      </form>

      <div className="flex-1 overflow-auto">{getPageContent()}</div>

      <div className="h-5 bg-[#c0c0c0] border-t border-[#808080] flex items-center px-2">
        <span className="text-[10px] text-[#404040]">Hazır | ega://</span>
      </div>
    </div>
  );
};

export default BrowserApp;