'use client';

/**
 * Authentication Context
 * Provides auth state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';
import type { User, LoginCredentials, AuthState } from '@/types';

// ========================================
// Context Types
// ========================================

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ========================================
// Context Creation
// ========================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================================
// Provider Component
// ========================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid, clear auth state
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.login(credentials);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      router.push('/dashboard');
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [router]);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await authService.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push('/login');
    }
  }, [router]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return;

    try {
      const user = await authService.getCurrentUser();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  // ========================================
  // Context Value
  // ========================================

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ========================================
// Hook
// ========================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
