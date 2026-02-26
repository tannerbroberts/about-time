/**
 * Axios client configuration - placeholder for Phase 5
 */

import axios from 'axios';

// Default baseURL - will be configured in Phase 5 to use environment variables
const DEFAULT_BASE_URL = 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (auth, CSRF, etc.) - to be implemented in Phase 5
// Response interceptor (401 handling, retries) - to be implemented in Phase 5

/**
 * Configure the API client base URL
 * This should be called during app initialization
 */
export const configureApiClient = (baseURL: string): void => {
  apiClient.defaults.baseURL = baseURL;
};
