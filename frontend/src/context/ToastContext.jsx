import React, { createContext, useContext } from "react";
import { Toaster, toast as sonnerToast } from "sonner";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

// ─── Premium Custom Toast Card ───────────────────────────────────────────────
const ToastCard = ({ type, title, msg, toastId }) => {
  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      glow: "shadow-emerald-500/20",
      accent: "from-emerald-500/20 via-transparent",
      bar: "bg-gradient-to-r from-emerald-400 to-teal-400",
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      glow: "shadow-rose-500/20",
      accent: "from-rose-500/20 via-transparent",
      bar: "bg-gradient-to-r from-rose-400 to-pink-400",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      glow: "shadow-amber-500/20",
      accent: "from-amber-500/20 via-transparent",
      bar: "bg-gradient-to-r from-amber-400 to-orange-400",
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
      glow: "shadow-sky-500/20",
      accent: "from-sky-500/20 via-transparent",
      bar: "bg-gradient-to-r from-sky-400 to-blue-400",
    },
  };

  const c = config[type] || config.info;

  return (
    <div
      className={`relative flex items-start gap-3 w-[340px] rounded-2xl overflow-hidden
        bg-[#111111]/95 backdrop-blur-xl border border-white/[0.08]
        shadow-2xl ${c.glow} p-4 pr-3`}
      style={{ boxShadow: "0 24px 48px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}
    >
      {/* Glowing left accent gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${c.accent} to-transparent opacity-40 pointer-events-none`} />

      {/* Top progress bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.bar} opacity-80`} />

      {/* Icon */}
      <div className="mt-0.5 relative z-10">{c.icon}</div>

      {/* Text */}
      <div className="flex-1 min-w-0 relative z-10">
        {title && (
          <p className="text-[13px] font-semibold text-white leading-tight truncate">{title}</p>
        )}
        {msg && (
          <p className="text-[12px] text-white/50 leading-snug mt-0.5 truncate">{msg}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => sonnerToast.dismiss(toastId)}
        className="relative z-10 p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all shrink-0 mt-0.5 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Toast Helpers ────────────────────────────────────────────────────────────
const showToast = (type, msg, title) => {
  const id = sonnerToast.custom(
    (toastId) => <ToastCard type={type} title={title} msg={msg} toastId={toastId} />,
    { duration: 3000, id: `${type}-${Date.now()}` }
  );
  return id;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const toast = {
    success: (msg, title) => showToast("success", msg, title),
    error:   (msg, title) => showToast("error",   msg, title),
    warning: (msg, title) => showToast("warning", msg, title),
    info:    (msg, title) => showToast("info",    msg, title),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: "transparent", border: "none", boxShadow: "none", padding: 0 } }}
        gap={10}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: {
        success: (msg, title) => showToast("success", msg, title),
        error:   (msg, title) => showToast("error",   msg, title),
        warning: (msg, title) => showToast("warning", msg, title),
        info:    (msg, title) => showToast("info",    msg, title),
      },
    };
  }
  return context;
};

export { sonnerToast as toast };
