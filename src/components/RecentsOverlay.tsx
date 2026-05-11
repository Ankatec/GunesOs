import React from "react";

interface RecentItem {
  id: string;
  title: string;
  appId: string;
  preview?: React.ReactNode;
}

interface Props {
  items: RecentItem[];
  onPick: (id: string) => void;
  onClose: (id: string) => void;
  onDismiss: () => void;
  onClearAll: () => void;
}

/**
 * Gerçek telefon "son uygulamalar" görünümü:
 * Kartlar üst üste yığılmış şekilde, dokun→aç, yukarı kaydır→kapat.
 */
const RecentsOverlay: React.FC<Props> = ({ items, onPick, onClose, onDismiss, onClearAll }) => {
  return (
    <div
      className="fixed inset-0 z-[9100] bg-black/70 backdrop-blur-md flex flex-col"
      onClick={onDismiss}
    >
      <div className="flex justify-between items-center px-5 pt-6 pb-3 text-white/90">
        <span className="text-sm font-medium">Son Uygulamalar ({items.length})</span>
        {items.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onClearAll(); }}
            className="text-xs px-3 py-1.5 rounded-full bg-white/15 active:bg-white/25"
          >
            Tümünü Kapat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-4 px-6 pb-24 snap-x snap-mandatory" onClick={(e) => e.stopPropagation()}>
        {items.length === 0 && (
          <div className="w-full text-center text-white/70 text-sm">Açık uygulama yok</div>
        )}
        {items.map((it, i) => (
          <SwipeCard
            key={it.id}
            title={it.title}
            onTap={() => onPick(it.id)}
            onSwipeUp={() => onClose(it.id)}
            zStyle={{ marginLeft: i === 0 ? 0 : -40, zIndex: items.length - i }}
          >
            {it.preview}
          </SwipeCard>
        ))}
      </div>
    </div>
  );
};

const SwipeCard: React.FC<{
  title: string;
  onTap: () => void;
  onSwipeUp: () => void;
  zStyle?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ title, onTap, onSwipeUp, zStyle, children }) => {
  const startY = React.useRef<number | null>(null);
  const [dy, setDy] = React.useState(0);
  const moved = React.useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    moved.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const d = e.touches[0].clientY - startY.current;
    if (Math.abs(d) > 4) moved.current = true;
    setDy(Math.min(0, d));
  };
  const onTouchEnd = () => {
    if (dy < -120) onSwipeUp();
    else if (!moved.current) onTap();
    startY.current = null;
    setDy(0);
  };

  return (
    <div
      className="snap-center shrink-0 w-[78vw] max-w-sm h-[70vh] bg-white rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 transition-transform"
      style={{
        ...zStyle,
        transform: dy ? `translateY(${dy}px)` : undefined,
        opacity: dy ? Math.max(0.3, 1 + dy / 400) : 1,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onTap}
    >
      <div className="h-9 px-4 flex items-center bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
        <span className="text-[12px] font-semibold text-slate-700 truncate">{title}</span>
      </div>
      <div className="w-full h-[calc(100%-36px)] bg-white pointer-events-none overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default RecentsOverlay;
