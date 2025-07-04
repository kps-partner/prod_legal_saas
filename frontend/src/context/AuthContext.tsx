'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User, LoginRequest, RegisterRequest } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<{ requiresPasswordChange: boolean }>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user data:', error);
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const authResponse = await apiClient.login(data);
      localStorage.setItem('access_token', authResponse.access_token);
      
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
      
      // Check if user needs to change password
      if (userData.status === 'pending_password_change' ||
          (userData.password_expires_at && new Date(userData.password_expires_at) < new Date())) {
        // Don't throw error, let the component handle the redirect
        return { requiresPasswordChange: true };
      }
      
      return { requiresPasswordChange: false };
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const userData = await apiClient.register(data);
      
      // Auto-login after registration
      await login({
        username: data.email,
        password: data.password,
      });
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}