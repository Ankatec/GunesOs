import React, { useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Search, Plus, MoreVertical, Phone, MessageSquare, Video, Star,
  ArrowLeft, Camera, Mail, MapPin, Users, Menu, Share2, Trash2, X, Check,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  surname?: string;
  phone?: string;
  email?: string;
  address?: string;
  groups?: string;
  photo?: string;
  favorite?: boolean;
}

const ACCENT = "#FF9800";

function initial(name: string) {
  const n = (name || "").trim();
  return n ? n[0].toLocaleUpperCase("tr") : "?";
}
function fullName(c: Contact) {
  return [c.name, c.surname].filter(Boolean).join(" ").trim();
}

type FilterKey = "all" | "phone" | "sohbeto";

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useLocalStorage<Contact[]>("gunesos.contacts", []);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [settings, setSettings] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  // Çoklu seçim
  const [selectionMode, setSelectionMode] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Selection mode kapanınca temizle
  useEffect(() => {
    if (!selectionMode) setPicked(new Set());
  }, [selectionMode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = contacts;
    if (filter === "phone") list = list.filter((c) => !!c.phone);
    if (filter === "sohbeto") list = list.filter((c) => !!c.email);
    if (q) list = list.filter((c) => fullName(c).toLocaleLowerCase("tr").includes(q));
    return [...list].sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"));
  }, [contacts, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>();
    for (const c of filtered) {
      const letter = initial(fullName(c));
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const saveContact = (c: Contact) => {
    setContacts((prev) => {
      const exists = prev.some((p) => p.id === c.id);
      return exists ? prev.map((p) => (p.id === c.id ? c : p)) : [...prev, c];
    });
    setEditing(null);
    setSelected(null);
  };
  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((p) => p.id !== id));
    setSelected(null);
  };
  const deleteMany = (ids: Set<string>) => {
    setContacts((prev) => prev.filter((p) => !ids.has(p.id)));
    setSelectionMode(false);
  };
  const toggleFav = (c: Contact) => {
    const updated = { ...c, favorite: !c.favorite };
    setContacts((prev) => prev.map((p) => (p.id === c.id ? updated : p)));
    setSelected(updated);
  };

  // Long-press
  const lpTimer = React.useRef<number | null>(null);
  const startLP = (id: string) => {
    lpTimer.current = window.setTimeout(() => {
      setSelectionMode(true);
      setPicked(new Set([id]));
    }, 450);
  };
  const cancelLP = () => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
  };
  const togglePick = (id: string) => {
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      if (n.size === 0) setSelectionMode(false);
      return n;
    });
  };
  const pickAll = () => {
    if (picked.size === filtered.length) setPicked(new Set());
    else setPicked(new Set(filtered.map((c) => c.id)));
  };

  // EDITOR
  if (editing) {
    return <ContactEditor initialData={editing} onCancel={() => setEditing(null)} onSave={saveContact} onDelete={deleteContact} />;
  }

  // DETAIL
  if (selected) {
    return (
      <div className="w-full h-full flex flex-col bg-[#FAFAFA] text-gray-900 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <style>{`.no-sb::-webkit-scrollbar{display:none}`}</style>
        <div className="relative bg-white pt-3 pb-6 flex flex-col items-center border-b border-gray-100">
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <button onClick={() => setSelected(null)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100" aria-label="Geri">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleFav(selected)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100" aria-label="Favori">
                <Star className={`w-5 h-5 ${selected.favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-500"}`} />
              </button>
              <button onClick={() => setEditing(selected)} className="px-3 h-10 text-sm text-[#1976D2] font-medium active:bg-gray-100 rounded-full">
                Düzenle
              </button>
            </div>
          </div>
          <div className="mt-10 w-28 h-28 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
            {selected.photo ? <img src={selected.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-5xl font-light text-black">{initial(fullName(selected))}</span>}
          </div>
          <p className="mt-3 text-xl text-gray-900">{fullName(selected) || "İsimsiz"}</p>
        </div>

        <div className="grid grid-cols-3 bg-white border-b border-gray-100">
          {[{ icon: Phone, label: "Ara" }, { icon: MessageSquare, label: "Mesaj" }, { icon: Video, label: "Görüntülü" }].map((a, i) => (
            <button key={i} className="flex flex-col items-center gap-1 py-4 active:bg-gray-100">
              <a.icon className="w-5 h-5 text-[#1976D2]" />
              <span className="text-xs text-gray-700">{a.label}</span>
            </button>
          ))}
        </div>

        <Field label="Telefon" value={selected.phone} icon={<Phone className="w-4 h-4" />} />
        <Field label="E-posta" value={selected.email} icon={<Mail className="w-4 h-4" />} />
        <Field label="Adres" value={selected.address} icon={<MapPin className="w-4 h-4" />} />
        <Field label="Gruplar" value={selected.groups} icon={<Users className="w-4 h-4" />} />
      </div>
    );
  }

  // LIST
  return (
    <div className="w-full h-full flex flex-col bg-white text-gray-900 relative overflow-hidden">
      <style>{`.no-sb::-webkit-scrollbar{display:none}`}</style>

      {/* TOP BAR */}
      {selectionMode ? (
        <div className="px-2 pt-3 pb-2 bg-white border-b border-gray-100 flex items-center gap-2">
          <button onClick={pickAll} className="flex items-center gap-2 pl-1 pr-3 h-10 rounded-full active:bg-gray-100" aria-label="Tümünü seç">
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${picked.size === filtered.length && filtered.length > 0 ? "border-[#FF9800] bg-[#FF9800]" : "border-gray-400"}`}>
              {picked.size === filtered.length && filtered.length > 0 && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </span>
            <span className="text-sm text-gray-800">Hepsi</span>
          </button>
          <span className="flex-1 text-center text-sm font-medium text-gray-900">{picked.size} seçildi</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100" aria-label="Paylaş" disabled={picked.size === 0}>
            <Share2 className={`w-5 h-5 ${picked.size ? "text-gray-700" : "text-gray-300"}`} />
          </button>
          <button onClick={() => picked.size && confirm(`${picked.size} kişi silinsin mi?`) && deleteMany(picked)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100" aria-label="Sil" disabled={picked.size === 0}>
            <Trash2 className={`w-5 h-5 ${picked.size ? "text-red-600" : "text-gray-300"}`} />
          </button>
          <button onClick={() => setSelectionMode(false)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100" aria-label="Kapat">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      ) : (
        <div className="px-2 pt-3 pb-2 bg-white">
          <div className="flex items-center justify-between mb-3 px-2">
            <button onClick={() => setDrawer(true)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100" aria-label="Menü">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-[20px] font-medium text-gray-900">Kişiler</h1>
            <button onClick={() => setSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100" aria-label="Ayarlar">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mx-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kişilerde ara"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
            />
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="flex-1 overflow-y-auto no-sb">
        {contacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 pt-20">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Henüz kişi yok</p>
            <p className="text-xs mt-1">Sağ alttaki + ile ekleyebilirsin</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">{filtered.length} kişi</div>
            {grouped.map(([letter, list]) => (
              <div key={letter}>
                <div className="px-4 py-1 text-xs font-semibold text-black bg-gray-50 sticky top-0 z-[1]">{letter}</div>
                {list.map((c) => {
                  const isPicked = picked.has(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (selectionMode) togglePick(c.id);
                        else setSelected(c);
                      }}
                      onPointerDown={() => !selectionMode && startLP(c.id)}
                      onPointerUp={cancelLP}
                      onPointerLeave={cancelLP}
                      onPointerCancel={cancelLP}
                      onContextMenu={(e) => { e.preventDefault(); setSelectionMode(true); setPicked(new Set([c.id])); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 active:bg-gray-100 border-b border-gray-50 cursor-pointer select-none ${isPicked ? "bg-orange-50" : ""}`}
                      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
                    >
                      <div className="relative w-11 h-11 shrink-0">
                        <div className="w-11 h-11 rounded-full bg-white border border-gray-300 flex items-center justify-center text-black text-base font-medium overflow-hidden">
                          {c.photo ? <img src={c.photo} alt="" className="w-full h-full object-cover" /> : initial(fullName(c))}
                        </div>
                        {selectionMode && (
                          <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${isPicked ? "bg-[#FF9800]" : "bg-gray-300"}`}>
                            {isPicked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[15px] text-gray-900 truncate">{fullName(c) || "İsimsiz"}</p>
                      </div>
                      {c.favorite && !selectionMode && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* FAB */}
      {!selectionMode && (
        <button
          onClick={() => setEditing({ id: crypto.randomUUID(), name: "", surname: "", phone: "", email: "", address: "", groups: "" })}
          className="absolute right-5 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          style={{ background: ACCENT, bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
          aria-label="Yeni kişi"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* DRAWER (≡) */}
      {drawer && (
        <div className="absolute inset-0 z-20 flex" onClick={() => setDrawer(false)}>
          <div className="w-72 bg-white h-full shadow-2xl p-4 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-medium text-gray-900 px-2 py-3">Görüntüle</p>
            {([
              { key: "all", label: "Tüm kişiler", icon: Users },
              { key: "phone", label: "Telefon", icon: Phone },
              { key: "sohbeto", label: "Sohbeto", icon: MessageSquare },
            ] as { key: FilterKey; label: string; icon: any }[]).map((it) => {
              const active = filter === it.key;
              return (
                <button
                  key={it.key}
                  onClick={() => { setFilter(it.key); setDrawer(false); }}
                  className="flex items-center gap-3 px-2 py-3 rounded-xl active:bg-gray-100"
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? "" : "bg-gray-100"}`} style={active ? { background: ACCENT } : undefined}>
                    <it.icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-700"}`} />
                  </span>
                  <span className="flex-1 text-left text-[15px] text-gray-900">{it.label}</span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? "border-[#FF9800]" : "border-gray-300"}`}>
                    {active && <span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT }} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 bg-black/30" />
        </div>
      )}

      {/* SETTINGS MODAL */}
      {settings && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={() => setSettings(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-base font-medium text-gray-900">Ayarlar</p>
              <button onClick={() => setSettings(false)} className="w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="py-2">
              {["Görüntüleme sırası", "İçe / Dışa aktar", "Birleştirilen kişiler", "Engellenen numaralar", "Hakkında"].map((t) => (
                <button key={t} className="w-full text-left px-5 py-3.5 text-[15px] text-gray-800 active:bg-gray-50">{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value?: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-start gap-3">
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1976D2] shrink-0 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-base ${value ? "text-gray-900" : "text-gray-400"}`}>{value || "Eklenmedi"}</p>
    </div>
  </div>
);

// EDITOR
const ContactEditor: React.FC<{
  initialData: Contact;
  onCancel: () => void;
  onSave: (c: Contact) => void;
  onDelete: (id: string) => void;
}> = ({ initialData: init, onCancel, onSave, onDelete }) => {
  const [c, setC] = useState<Contact>(init);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const isNew = !init.name && !init.surname && !init.phone;

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setC({ ...c, photo: ev.target?.result as string });
    r.readAsDataURL(f);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <style>{`.no-sb::-webkit-scrollbar{display:none}`}</style>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-2 py-2 flex items-center justify-between z-10">
        <button onClick={onCancel} className="px-3 h-10 text-sm text-gray-700 active:bg-gray-100 rounded-full">İptal</button>
        <p className="text-base font-medium text-gray-900">{isNew ? "Yeni kişi" : "Düzenle"}</p>
        <button onClick={() => onSave(c)} className="px-3 h-10 text-sm font-semibold text-[#1976D2] active:bg-gray-100 rounded-full">Kaydet</button>
      </div>

      {/* Foto alanı - badge artık dışarıda, kırpılmıyor */}
      <div className="flex flex-col items-center py-8 border-b border-gray-100 bg-gray-50">
        <div className="relative w-28 h-28">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-28 h-28 rounded-full bg-white border border-gray-300 flex items-center justify-center overflow-hidden"
          >
            {c.photo ? <img src={c.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-5xl font-light text-black">{c.name ? initial(fullName(c)) : "?"}</span>}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full text-white flex items-center justify-center border-[3px] border-gray-50 shadow-md active:scale-95 transition-transform"
            style={{ background: ACCENT }}
            aria-label="Fotoğraf ekle"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
      </div>

      <div className="bg-white">
        <EditRow label="Ad" value={c.name} onChange={(v) => setC({ ...c, name: v })} />
        <EditRow label="Soyad" value={c.surname || ""} onChange={(v) => setC({ ...c, surname: v })} />
        <EditRow label="Telefon" value={c.phone || ""} onChange={(v) => setC({ ...c, phone: v })} type="tel" />
        <EditRow label="E-posta" value={c.email || ""} onChange={(v) => setC({ ...c, email: v })} type="email" />
        <EditRow label="Adres" value={c.address || ""} onChange={(v) => setC({ ...c, address: v })} />
        <EditRow label="Gruplar" value={c.groups || ""} onChange={(v) => setC({ ...c, groups: v })} />
      </div>

      {!isNew && (
        <button
          onClick={() => { if (confirm("Bu kişi silinsin mi?")) onDelete(c.id); }}
          className="mx-4 my-6 py-3 rounded-2xl text-red-600 bg-red-50 active:bg-red-100 text-sm font-medium"
        >
          Kişiyi sil
        </button>
      )}
    </div>
  );
};

const EditRow: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = "text" }) => (
  <label className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 active:bg-gray-50">
    <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 outline-none text-[15px] text-gray-900 bg-transparent placeholder:text-gray-300"
      placeholder={label}
    />
  </label>
);

export default Contacts;
