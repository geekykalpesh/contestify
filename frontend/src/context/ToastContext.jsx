import React, { createContext, useContext } from "react";
import { Toaster, toast as sonnerToast } from "sonner";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toast = {
    success: (msg, title) =>
      sonnerToast.success(title || "Success", {
        description: msg,
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
      }),
    error: (msg, title) =>
      sonnerToast.error(title || "Action Restricted", {
        description: msg,
        icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
      }),
    warning: (msg, title) =>
      sonnerToast.warning(title || "Notice", {
        description: msg,
        icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
      }),
    info: (msg, title) =>
      sonnerToast.info(title || "Information", {
        description: msg,
        icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
      }),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster
        position="top-right"
        closeButton
        duration={3500}
        toastOptions={{
          className: "ig-toast-card",
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            borderColor: "var(--border-main)",
            borderRadius: "16px",
            padding: "14px 16px",
            fontSize: "13px",
            fontWeight: "500",
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)",
          },
        }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: {
        success: (msg, title) =>
          sonnerToast.success(title || "Success", {
            description: msg,
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          }),
        error: (msg, title) =>
          sonnerToast.error(title || "Action Restricted", {
            description: msg,
            icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          }),
        warning: (msg, title) =>
          sonnerToast.warning(title || "Notice", {
            description: msg,
            icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          }),
        info: (msg, title) =>
          sonnerToast.info(title || "Information", {
            description: msg,
            icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
          }),
      },
    };
  }
  return context;
};

export { sonnerToast as toast };
