/**
 * Auth context for managing user authentication state
 */

import { configureApiClient, login, register, logout, getCurrentUser } from '@about-time/api-client';
import type { User } from '@about-time/types';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): React.JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure API client on mount
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    configureApiClient(apiUrl);

    // Check if user is already authenticated
    const checkAuth = async (): Promise<void> => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // User not authenticated - this is expected behavior
        // However, log unexpected errors for debugging (not 401s)
        const is401Error = error instanceof Error &&
                          (error.message.includes('401') || error.message.includes('Unauthorized'));

        if (!is401Error) {
          console.error('[Auth] Unexpected error during authentication check:', error);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const newUser = await register(email, password, displayName);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setError(null);
    try {
      await logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
