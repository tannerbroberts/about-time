/**
 * Axios client configuration with interceptors
 */

import axios, { AxiosError } from 'axios';

// Default baseURL - configured during app initialization
const DEFAULT_BASE_URL = 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (response.config.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear any local auth state
      console.warn('[API] Unauthorized - session expired');
      // Could trigger logout here or redirect to login
      return Promise.reject(error);
    }

    // Retry logic for network errors or 5xx errors
    if (
      originalRequest &&
      !originalRequest.metadata?.retryCount &&
      (error.code === 'ECONNABORTED' ||
       error.code === 'ERR_NETWORK' ||
       (error.response?.status && error.response.status >= 500))
    ) {
      originalRequest.metadata = originalRequest.metadata || {};
      originalRequest.metadata.retryCount = (originalRequest.metadata.retryCount || 0) + 1;

      if (originalRequest.metadata.retryCount <= 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, originalRequest.metadata.retryCount - 1) * 1000;
        console.log(`[API] Retrying request (${originalRequest.metadata.retryCount}/3) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Configure the API client base URL
 * Call this during app initialization with environment-specific URL
 */
export const configureApiClient = (baseURL: string): void => {
  apiClient.defaults.baseURL = baseURL;
  console.log(`[API] Configured base URL: ${baseURL}`);
};

/**
 * Helper to check if client is online
 */
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Extend axios config to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime?: number;
      retryCount?: number;
    };
  }
}
