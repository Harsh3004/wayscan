'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import { fetchMe, login as apiLogin, signup as apiSignup, logout as apiLogout, getAuthToken, setAuthToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('wayscan_token');
    if (token) {
      setAuthToken(token);
      const currentUser = await fetchMe();
      if (currentUser) {
        setUser(currentUser);
      } else {
        localStorage.removeItem('wayscan_token');
        setAuthToken(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/login', '/signup'];
      if (!user && !publicPaths.includes(pathname)) {
        router.push('/login');
      } else if (user && publicPaths.includes(pathname)) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    if (result.success && result.user) {
      const token = getAuthToken();
      if (token) {
        localStorage.setItem('wayscan_token', token);
      }
      setUser(result.user);
      router.push('/');
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const signup = async (username: string, password: string) => {
    const result = await apiSignup(username, password);
    if (result.success && result.user) {
      const token = getAuthToken();
      if (token) {
        localStorage.setItem('wayscan_token', token);
      }
      setUser(result.user);
      router.push('/');
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to sign up' };
  };

  const logout = () => {
    apiLogout();
    localStorage.removeItem('wayscan_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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
