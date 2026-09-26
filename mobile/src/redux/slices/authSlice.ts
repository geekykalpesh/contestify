import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { safeStorage } from '../../utils/storage';
import { userApi } from '../../services/api';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  username: string;
  email: string;
  role?: string;
  residency?: string;
  avatarUrl?: string;
  followers?: number;
  following?: number;
  kycDetails?: {
    status?: 'NOT_SUBMITTED' | 'PENDING' | 'PASSED' | 'FAILED';
    aadharNumber?: string;
    aadharMobile?: string;
    dob?: string;
    aadharImage?: string;
    rejectionReason?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  error: null,
  isAdmin: false,
};

export const loadStoredAuth = createAsyncThunk('auth/loadStoredAuth', async () => {
  try {
    const storedToken = await safeStorage.getItem('auth_token');
    const storedUser = await safeStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      return { token: storedToken, user: JSON.parse(storedUser) };
    }
  } catch (err) {
    console.error('Error loading stored auth:', err);
  }
  return { token: null, user: null };
});

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ identifier, password }: { identifier: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await userApi.post('/auth/login', { identifier, password });
      const { token, user } = response.data.data;
      await safeStorage.setItem('auth_token', token);
      await safeStorage.setItem('auth_user', JSON.stringify(user));
      return { token, user };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      return rejectWithValue(msg);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await safeStorage.removeItem('auth_token');
  await safeStorage.removeItem('auth_user');
  return null;
});

const checkIsAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    user.email === 'admin@gmail.com' ||
    user.email === 'admin@creator.com'
  );
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAdmin = checkIsAdmin(action.payload);
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAdmin = checkIsAdmin(action.payload.user);
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAdmin = checkIsAdmin(action.payload.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Authentication failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAdmin = false;
        state.loading = false;
      });
  },
});

export const { setUser, setToken, clearError } = authSlice.actions;
export default authSlice.reducer;
