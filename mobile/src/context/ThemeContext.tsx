import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../utils/storage';
import { useColorScheme } from 'react-native';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark'); // Default to sleek Instagram Dark Mode

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await safeStorage.getItem('app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setMode(savedTheme);
      } else if (systemScheme === 'light' || systemScheme === 'dark') {
        setMode(systemScheme);
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    await safeStorage.setItem('app_theme', nextMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark: mode === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
