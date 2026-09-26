import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const inMemoryStorage = new Map<string, string>();

const isWeb =
  Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
      const val = await AsyncStorage.getItem(key);
      return val;
    } catch (err) {
      return inMemoryStorage.get(key) || null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    inMemoryStorage.set(key, value);
    try {
      if (isWeb) {
        window.localStorage.setItem(key, value);
      }
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      // Silently swallow native storage errors; in-memory fallback active
    }
  },

  removeItem: async (key: string): Promise<void> => {
    inMemoryStorage.delete(key);
    try {
      if (isWeb) {
        window.localStorage.removeItem(key);
      }
      await AsyncStorage.removeItem(key);
    } catch (err) {
      // Silently swallow native storage errors; in-memory fallback active
    }
  },
};
