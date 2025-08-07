'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, User } from './api';
import { notifications } from '@mantine/notifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROTECTED_ROUTES = ['/tasks'];

const PUBLIC_ROUTES = ['/sign-in', '/sign-up'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname?.startsWith(route)
  );

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname?.startsWith(route)
  );

  const checkAuth = async () => {
    if (isPublicRoute) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.auth.me();
      setUser(response.data);
    } catch (error: any) {
      console.log('Auth check failed:', error.response?.status);
      
      if (isProtectedRoute) {
        router.push('/sign-in');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isProtectedRoute) {
      checkAuth();
    }
  }, [pathname]);

  const login = async (username: string, password: string) => {
    try {
      await api.auth.login({ username, password });
      const response = await api.auth.me();
      setUser(response.data);
      
      notifications.show({
        title: 'Успех',
        message: 'Вы успешно вошли в систему',
        color: 'green',
      });
      
      router.push('/tasks');
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Ошибка входа',
        color: 'red',
      });
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.auth.register({ username, email, password });
      notifications.show({
        title: 'Успех',
        message: 'Регистрация прошла успешно',
        color: 'green',
      });
      
      router.push('/sign-in');
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Ошибка регистрации',
        color: 'red',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Ошибка при логауте:', error);
    } finally {
      setUser(null);
      router.push('/sign-in');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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