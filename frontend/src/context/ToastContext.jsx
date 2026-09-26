import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

// ─── Single Snackbar Item ─────────────────────────────────────────────────────
const SnackbarItem = ({ item, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Slide in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Start leaving
    const t2 = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(item.id), 300);
    }, item.duration || 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const config = {
    success: { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />, dot: "bg-emerald-400" },
    error:   { icon: <AlertCircle   className="w-4 h-4 text-rose-400 shrink-0" />,    dot: "bg-rose-400"    },
    warning: { icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,   dot: "bg-amber-400"   },
    info:    { icon: <Info          className="w-4 h-4 text-sky-400 shrink-0" />,      dot: "bg-sky-400"     },
  };
  const c = config[item.type] || config.info;

  return (
    <div
      style={{
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: visible && !leaving ? "translateY(0) scale(1)" : "translateY(20px) scale(0.92)",
        opacity: visible && !leaving ? 1 : 0,
      }}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-full
        bg-[#1a1a1a]/95 backdrop-blur-xl
        border border-white/[0.09]
        shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]
        max-w-[380px] w-max"
    >
      {/* Colored dot indicator */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />

      {/* Message */}
      <span className="text-[13px] font-medium text-white/90 leading-none whitespace-nowrap">
        {item.title && <span className="font-semibold text-white">{item.title}</span>}
        {item.title && item.msg && <span className="text-white/40 mx-1">·</span>}
        {item.msg && <span className="text-white/65">{item.msg}</span>}
      </span>

      {/* Dismiss button */}
      <button
        onClick={() => { setLeaving(true); setTimeout(() => onRemove(item.id), 300); }}
        className="ml-1 p-0.5 rounded-full text-white/25 hover:text-white/60 transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// ─── Snackbar Stack (bottom-center) ──────────────────────────────────────────
const SnackbarContainer = ({ items, onRemove }) => {
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <SnackbarItem item={item} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addItem = useCallback((type, msg, title, duration = 2500) => {
    const id = ++idCounter;
    setItems((prev) => [...prev.slice(-2), { id, type, msg, title, duration }]); // max 3 at once
    return id;
  }, []);

  const toast = {
    success: (msg, title, dur) => addItem("success", msg, title, dur),
    error:   (msg, title, dur) => addItem("error",   msg, title, dur || 3500),
    warning: (msg, title, dur) => addItem("warning", msg, title, dur),
    info:    (msg, title, dur) => addItem("info",    msg, title, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <SnackbarContainer items={items} onRemove={removeItem} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback (console only — shouldn't happen in app)
    return {
      toast: {
        success: (msg) => console.log("[Toast]", msg),
        error:   (msg) => console.error("[Toast]", msg),
        warning: (msg) => console.warn("[Toast]", msg),
        info:    (msg) => console.info("[Toast]", msg),
      },
    };
  }
  return context;
};
