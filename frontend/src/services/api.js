import axios from "axios";
import { USER_SERVICE_URL, ADMIN_SERVICE_URL } from "../config";

const USER_API_BASE = `${USER_SERVICE_URL}/api`;
const ADMIN_API_BASE = `${ADMIN_SERVICE_URL}/api`;

export const userApi = axios.create({
  baseURL: USER_API_BASE
});

export const adminApi = axios.create({
  baseURL: ADMIN_API_BASE
});

// Interceptor to attach JWT token
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
