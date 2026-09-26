import axios from 'axios';
import { safeStorage } from '../utils/storage';
import { USER_SERVICE_URL, ADMIN_SERVICE_URL } from '../config';

const USER_API_BASE = `${USER_SERVICE_URL}/api`;
const ADMIN_API_BASE = `${ADMIN_SERVICE_URL}/api`;

export const userApi = axios.create({
  baseURL: USER_API_BASE,
  timeout: 15000,
});

export const adminApi = axios.create({
  baseURL: ADMIN_API_BASE,
  timeout: 15000,
});

// Interceptor to attach JWT token to all user requests
userApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await safeStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Error fetching token from storage', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to attach JWT token to all admin requests
adminApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await safeStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Error fetching token from storage', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
