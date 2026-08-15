'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, AuthState } from '@/lib/types/auth';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // The cookie is what actually decides access — the middleware gates every
    // route on it. localStorage only caches who the token belongs to, and it
    // can be cleared independently (browser cleanup, storage pressure, private
    // mode). Requiring both meant a perfectly valid session rendered a "ورود"
    // button in the header and hid the profile link, on a page the middleware
    // had just let through.
    const token = Cookies.get('auth_token');
    if (!token) return;

    let user: User | null = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) user = JSON.parse(stored);
    } catch {
      // A corrupt entry is no reason to sign somebody out.
    }

    setAuthState({ user, isAuthenticated: true });
  }, []);

  const login = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ user, isAuthenticated: true });
  };

  const logout = () => {
    Cookies.remove('auth_token');
    localStorage.removeItem('user');
    setAuthState({ user: null, isAuthenticated: false });
    router.push('/login')
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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