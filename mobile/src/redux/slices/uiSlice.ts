import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToastNotice {
  id: string;
  message: string;
  title?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
  theme: 'dark' | 'light';
  isCreateModalOpen: boolean;
  toasts: ToastNotice[];
}

const initialState: UIState = {
  theme: 'dark',
  isCreateModalOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setCreateModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateModalOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<ToastNotice, 'id'>>) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      state.toasts.push({ id, ...action.payload });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setTheme, toggleTheme, setCreateModalOpen, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
