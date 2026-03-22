import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { IAuthUser } from '../types';

const TOKEN_KEY = 'fitflow_token';
const USER_KEY = 'fitflow_user';

interface AuthContextType {
  user: IAuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IAuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const { data } = await res.json();

      const authUser: IAuthUser = {
        id: data.id,
        email: data.email,
        username: data.username,
        token: data.token,
      };

      localStorage.setItem(TOKEN_KEY, authUser.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      setUser(authUser);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
