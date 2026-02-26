/**
 * Authentication types shared between frontend and backend
 */

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  oauthProvider: 'google' | 'github' | null;
  oauthId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  sessionId: string;
}
