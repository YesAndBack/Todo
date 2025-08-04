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

// Список защищенных маршрутов, требующих авторизации
const PROTECTED_ROUTES = ['/tasks'];

// Список публичных маршрутов, где не нужно проверять авторизацию
const PUBLIC_ROUTES = ['/sign-in', '/sign-up'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Изначально false
  const pathname = usePathname();
  const router = useRouter();

  // Проверка, является ли текущий маршрут защищенным
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname?.startsWith(route)
  );

  // Проверка, является ли текущий маршрут публичным
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname?.startsWith(route)
  );

  const checkAuth = async () => {
    // Не проверяем авторизацию на публичных маршрутах
    if (isPublicRoute) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.auth.me();
      setUser(response.data);
    } catch (error: any) {
      console.log('Auth check failed:', error.response?.status);
      
      // Если на защищенном маршруте и нет авторизации, перенаправляем
      if (isProtectedRoute) {
        router.push('/sign-in');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Проверяем авторизацию только при переходе на защищенный маршрут
    // или при первой загрузке (если не на публичном маршруте)
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
      
      // После успешного входа перенаправляем на страницу задач
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
      
      // После успешной регистрации перенаправляем на страницу входа
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