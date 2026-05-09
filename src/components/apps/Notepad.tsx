import React, { useState } from "react";

interface NotepadProps {
  onSaveFile?: (name: string, content: string) => void;
}

const Notepad: React.FC<NotepadProps> = ({ onSaveFile }) => {
  const [text, setText] = useState(
    "GüneşOS Not Defteri'ne hoş geldiniz!\n\nBuraya notlarınızı yazabilirsiniz."
  );
  const [fileName, setFileName] = useState("Adsız.txt");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (onSaveFile) {
      onSaveFile(fileName, text);
      setSaved(true);
      setShowSaveDialog(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const lineCount = text.split("\n").length;

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex items-center gap-1 px-1 py-[2px] bg-[#e8e8e8] border-b border-[#a0a0a0]">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="text-[11px] px-2 py-[2px] hover:bg-[#d0d0d0] rounded text-black"
        >
          💾 Kaydet
        </button>
        <button
          onClick={() => {
            setText("");
            setFileName("Adsız.txt");
          }}
          className="text-[11px] px-2 py-[2px] hover:bg-[#d0d0d0] rounded text-black"
        >
          📄 Yeni
        </button>
        {saved && <span className="text-[10px] text-green-600 ml-2">✅ Kaydedildi!</span>}
      </div>

      <textarea
        className="flex-1 w-full resize-none p-2 text-[13px] font-mono bg-white text-black border-none outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />

      <div className="h-5 bg-[#c0c0c0] border-t border-[#808080] flex items-center px-2 justify-between">
        <span className="text-[10px] text-[#404040]">{fileName}</span>
        <span className="text-[10px] text-[#404040]">
          Satır: {lineCount} | Karakter: {text.length}
        </span>
      </div>

      {showSaveDialog && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
          <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-4 shadow-lg min-w-[280px]">
            <h3 className="text-sm font-bold mb-3 text-black">Farklı Kaydet</h3>
            <div className="mb-3">
              <label className="text-[11px] block mb-1 text-black">Dosya Adı:</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-2 py-1 text-[12px] border border-gray-400 bg-white text-black outline-none"
              />
            </div>
            <div className="mb-3">
              <label className="text-[11px] block mb-1 text-black">Konum:</label>
              <span className="text-[11px] text-gray-600">📁 Belgelerim</span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-1 text-[11px] bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] hover:bg-[#d0d0d0] text-black"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-[11px] bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] hover:bg-[#d0d0d0] font-bold text-black"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notepad;