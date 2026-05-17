import React, { useState } from "react";
import sunHappyImg from "@/assets/cute-sun.png";

interface LoginScreenProps {
  onUnlock: () => void;
}

const PASSWORD = "güneş1";

const LoginScreen: React.FC<LoginScreenProps> = ({ onUnlock }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = value.trim().toLocaleLowerCase("tr-TR");
    if (normalized === PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0b1a3a 0%,#1e2f6b 45%,#5a3a8a 100%)" }}>
      <style>{`
        @keyframes float-up { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shake-x  { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        @keyframes twk { 0%,100% { opacity: .3 } 50% { opacity: 1 } }
      `}</style>

      {/* stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="absolute text-white" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            fontSize: `${4 + Math.random() * 10}px`, opacity: 0.6,
            animation: `twk ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
          }}>✦</span>
        ))}
      </div>

      <div className={`relative z-10 w-[340px] p-6 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-white ${shake ? "" : ""}`}
        style={{ animation: shake ? "shake-x .45s ease" : undefined }}>
        <div className="flex flex-col items-center -mt-16 mb-2">
          <img src={sunHappyImg} alt="Güneş" width={96} height={96}
            style={{ animation: "float-up 3s ease-in-out infinite", filter: "drop-shadow(0 10px 24px rgba(251,191,36,.55))" }} />
        </div>
        <h1 className="text-center text-2xl font-extrabold tracking-tight">GüneşOS</h1>
        <p className="text-center text-xs opacity-70 mt-1 mb-5">Devam etmek için şifreni gir</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Şifre"
            className={`w-full h-12 px-4 rounded-xl bg-white/15 border outline-none text-center text-lg tracking-widest placeholder-white/40 ${error ? "border-rose-400" : "border-white/20 focus:border-amber-300"}`}
          />
          <button type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold shadow-lg hover:brightness-110 active:scale-[.98] transition">
            Kilidi Aç
          </button>
          {error && <p className="text-center text-xs text-rose-200">Şifre hatalı, tekrar dene 🌙</p>}
        </form>

        <p className="text-center text-[10px] opacity-50 mt-4">Test kilidi · geliştirme bittiğinde kaldırılacak</p>
      </div>
    </div>
  );
};

export default LoginScreen;
