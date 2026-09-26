import React, { createContext, useContext, useEffect } from 'react';
import { safeStorage } from '../utils/storage';
import { userApi } from '../services/api';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { loadStoredAuth, loginUser, logoutUser, setUser } from '../redux/slices/authSlice';
import type { User } from '../redux/slices/authSlice';

export type { User };

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (data: FormData | Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  updateResidency: (residency: string) => Promise<void>;
  updateAvatar: (formData: FormData) => Promise<void>;
  updateKyc: (formData: FormData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, token, loading, isAdmin } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  const login = async (identifier: string, password: string) => {
    const result = await dispatch(loginUser({ identifier, password }));
    if (loginUser.rejected.match(result)) {
      throw new Error((result.payload as string) || 'Login failed');
    }
  };

  const signup = async (data: FormData | Record<string, any>) => {
    let config = {};
    if (data instanceof FormData) {
      config = { headers: { 'Content-Type': 'multipart/form-data' } };
    }
    await userApi.post('/auth/signup', data, config);
  };

  const logout = async () => {
    await dispatch(logoutUser());
  };

  const updateResidency = async (residency: string) => {
    const response = await userApi.put('/auth/residency', { residency });
    const updatedUser = response.data.data;
    await safeStorage.setItem('auth_user', JSON.stringify(updatedUser));
    dispatch(setUser(updatedUser));
  };

  const updateAvatar = async (formData: FormData) => {
    const response = await userApi.put('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const updatedUser = response.data.data;
    await safeStorage.setItem('auth_user', JSON.stringify(updatedUser));
    dispatch(setUser(updatedUser));
  };

  const updateKyc = async (formData: FormData) => {
    const response = await userApi.put('/auth/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const updatedUser = response.data.data;
    await safeStorage.setItem('auth_user', JSON.stringify(updatedUser));
    dispatch(setUser(updatedUser));
  };

  const refreshUser = async () => {
    try {
      if (!user) return;
      const usernameOrId = user.username || user._id || user.id || '';
      const res = await userApi.get(`/posts/user/${encodeURIComponent(usernameOrId)}`);
      if (res.data?.data?.user) {
        const updated = res.data.data.user;
        await safeStorage.setItem('auth_user', JSON.stringify(updated));
        dispatch(setUser(updated));
      }
    } catch (err) {
      console.error('Failed to refresh user profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        login,
        signup,
        logout,
        updateResidency,
        updateAvatar,
        updateKyc,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
