'use client';

import { httpClient } from '@/lib/services/httpClient';
import { tokenManager } from '@/lib/services/tokenManager';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff';
  phone?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface ProfileResponse {
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await tokenManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    // Redirect to login page
    window.location.href = '/login';
  }, [logout]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const tokens = tokenManager.getTokens();
      
      if (tokens && tokenManager.isTokenValid()) {
        setUser(tokens.user);
        setIsAuthenticated(true);
      } else {
        // Clear invalid tokens
        tokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up token refresh listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'refreshToken' || e.key === 'user') {
        const tokens = tokenManager.getTokens();
        
        if (tokens && tokenManager.isTokenValid()) {
          setUser(tokens.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Monitor token expiration
  useEffect(() => {
    const checkTokenValidity = () => {
      if (isAuthenticated && !tokenManager.isTokenValid()) {
        // Token expired, logout user
        handleLogout();
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenValidity, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, handleLogout]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await httpClient.post('/api/auth/login', {
        email,
        password,
      }, { requireAuth: false });

      if (response.success && response.data) {
        const { token, refreshToken, user: userData } = response.data as LoginResponse;
        
        // Store tokens
        tokenManager.setTokens(token, refreshToken, userData);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const tokens = tokenManager.getTokens();
      if (tokens) {
        const response = await httpClient.get('/api/auth/profile');
        if (response.success && response.data) {
          const { user: updatedUser } = response.data as ProfileResponse;
          tokenManager.setTokens(tokens.token, tokens.refreshToken, updatedUser);
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4B49AC]"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
