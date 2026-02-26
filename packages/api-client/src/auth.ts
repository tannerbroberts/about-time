/**
 * Auth API endpoints
 */

import { apiClient } from './client.js';
import type { User } from '@about-time/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  success: true;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

/**
 * Login with email and password
 */
export const login = async (email: string, password: string): Promise<User> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  return {
    id: response.data.user.id,
    email: response.data.user.email,
    displayName: response.data.user.displayName,
    oauthProvider: null,
    oauthId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Register new user
 */
export const register = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    displayName,
  });

  return {
    id: response.data.user.id,
    email: response.data.user.email,
    displayName: response.data.user.displayName,
    oauthProvider: null,
    oauthId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<AuthResponse>('/auth/me');

  return {
    id: response.data.user.id,
    email: response.data.user.email,
    displayName: response.data.user.displayName,
    oauthProvider: null,
    oauthId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
