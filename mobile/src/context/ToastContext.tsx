import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString();
    const newToast: ToastMessage = {
      id,
      type,
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Info'),
      message,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message: string, title?: string) => addToast('success', message, title),
    error: (message: string, title?: string) => addToast('error', message, title),
    warning: (message: string, title?: string) => addToast('warning', message, title),
    info: (message: string, title?: string) => addToast('info', message, title),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View style={[styles.toastContainer, Platform.select({ web: { pointerEvents: 'none' as any }, default: { pointerEvents: 'box-none' as any } })]}>
        {toasts.map((t) => (
          <View
            key={t.id}
            style={[
              styles.toastCard,
              t.type === 'success' && styles.successBg,
              t.type === 'error' && styles.errorBg,
              t.type === 'warning' && styles.warningBg,
              t.type === 'info' && styles.infoBg,
            ]}
          >
            <View style={styles.iconWrapper}>
              {t.type === 'success' && <CheckCircle2 size={20} color="#34d399" />}
              {t.type === 'error' && <AlertCircle size={20} color="#f87171" />}
              {t.type === 'warning' && <AlertCircle size={20} color="#fbbf24" />}
              {t.type === 'info' && <Info size={20} color="#38bdf8" />}
            </View>

            <View style={styles.textWrapper}>
              <Text style={styles.toastTitle}>{t.title}</Text>
              {!!t.message && <Text style={styles.toastMessage}>{t.message}</Text>}
            </View>

            <TouchableOpacity onPress={() => removeToast(t.id)} style={styles.closeBtn}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#18181b',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0,0,0,0.4)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  successBg: {
    borderColor: 'rgba(52, 211, 153, 0.4)',
    backgroundColor: '#064e3b',
  },
  errorBg: {
    borderColor: 'rgba(248, 113, 113, 0.4)',
    backgroundColor: '#7f1d1d',
  },
  warningBg: {
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: '#78350f',
  },
  infoBg: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: '#0c4a6e',
  },
  iconWrapper: {
    marginRight: 10,
  },
  textWrapper: {
    flex: 1,
  },
  toastTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 6,
  },
});
