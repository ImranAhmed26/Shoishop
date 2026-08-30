import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || isAuthRoute || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      await new Promise<void>((resolve) => refreshQueue.push(resolve));
      return api(originalRequest);
    }

    isRefreshing = true;
    try {
      await api.post('/auth/refresh');
      refreshQueue.forEach((resolve) => resolve());
      refreshQueue = [];
      return api(originalRequest);
    } catch (refreshError) {
      refreshQueue = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
