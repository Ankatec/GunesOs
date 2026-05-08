import React, { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Contact {
  id: string;
  name: string;
  phone: string;
  emoji: string;
}

const defaultContacts: Contact[] = [
  { id: "1", name: "Anne", phone: "0532 111 22 33", emoji: "👩" },
  { id: "2", name: "Baba", phone: "0533 222 33 44", emoji: "👨" },
  { id: "3", name: "Dedem", phone: "0534 333 44 55", emoji: "👴" },
  { id: "4", name: "Ninem", phone: "0535 444 55 66", emoji: "👵" },
  { id: "5", name: "Acil Yardım", phone: "112", emoji: "🚑" },
];

const emojiOptions = ["👩", "👨", "👴", "👵", "👧", "👦", "👶", "🧑", "👱", "🧔", "👩‍🦰", "👨‍🦱"];

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useLocalStorage<Contact[]>("gunesOS-contacts", defaultContacts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmoji, setNewEmoji] = useState("🧑");

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setContacts((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: newName.trim(), phone: newPhone.trim(), emoji: newEmoji },
    ]);
    setNewName("");
    setNewPhone("");
    setNewEmoji("🧑");
    setIsAdding(false);
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = contacts.find((c) => c.id === selectedId);

  return (
    <div className="flex h-full">
      {/* Contact List */}
      <div className="w-1/2 border-r border-gray-300 overflow-auto bg-white">
        <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-700">📇 Rehber</span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isAdding ? "✕" : "+ Yeni"}
          </button>
        </div>

        {isAdding && (
          <div className="p-2 border-b border-gray-200 bg-blue-50 space-y-1">
            <div className="flex gap-1 flex-wrap">
              {emojiOptions.slice(0, 6).map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-lg ${newEmoji === e ? "bg-blue-200 rounded" : ""}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="İsim"
              className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 text-black"
            />
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Telefon"
              className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 text-black"
            />
            <button
              onClick={addContact}
              className="w-full text-[10px] px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Kaydet
            </button>
          </div>
        )}

        {contacts.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 ${
              selectedId === c.id ? "bg-blue-100" : ""
            }`}
          >
            <span className="text-xl">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-black truncate">{c.name}</p>
              <p className="text-[10px] text-gray-500">{c.phone}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Contact Detail */}
      <div className="w-1/2 bg-white overflow-auto">
        {selected ? (
          <div className="p-4 flex flex-col items-center">
            <span className="text-6xl mb-3">{selected.emoji}</span>
            <h3 className="text-lg font-bold text-gray-800">{selected.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{selected.phone}</p>
            <div className="flex gap-3">
              <button className="flex flex-col items-center gap-1 px-4 py-2 bg-green-50 rounded-lg hover:bg-green-100">
                <span className="text-2xl">📞</span>
                <span className="text-[10px] text-green-700">Ara</span>
              </button>
              <button className="flex flex-col items-center gap-1 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100">
                <span className="text-2xl">💬</span>
                <span className="text-[10px] text-blue-700">Mesaj</span>
              </button>
              <button
                onClick={() => deleteContact(selected.id)}
                className="flex flex-col items-center gap-1 px-4 py-2 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <span className="text-2xl">🗑️</span>
                <span className="text-[10px] text-red-700">Sil</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">Bir kişi seçin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;