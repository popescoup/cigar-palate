// utils/axiosConfig.js
import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

const api = axios.create({
  baseURL: '',
  withCredentials: true
});

let queryClient = null;

export const initializeAxiosInterceptors = (queryClientInstance) => {
  if (typeof window !== 'undefined') {
    queryClient = queryClientInstance;
  }
};

const setupAxiosInterceptors = () => {
  if (typeof window !== 'undefined') {
    axios.defaults.withCredentials = true;
    
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Don't redirect for auth check endpoints
          if (!error.config.url.includes('/api/auth/status')) {
            // Immediately redirect before error propagates to UI
            if (queryClient) {
              // Prevent error from reaching UI by handling cache invalidation
              // after navigation starts
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['authStatus'] });
                queryClient.clear();
              }, 0);
            }
            
            window.location.href = '/login';
            // Return a new promise that never resolves to prevent error from propagating
            return new Promise(() => {});
          }
        }
        return Promise.reject(error);
      }
    );
  }

  return api;
};

export { api };
export default setupAxiosInterceptors;