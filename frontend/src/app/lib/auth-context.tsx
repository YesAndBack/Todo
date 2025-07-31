'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User } from './api';
import { notifications } from '@mantine/notifications';
import { Center, Loader } from '@mantine/core';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.auth.me();
      setUser(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await api.auth.login({ username, password });
      await checkAuth();
      notifications.show({
        title: 'Успех',
        message: 'Вы успешно вошли в систему',
        color: 'green',
      });
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
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader />
      </Center>
    );
  }

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
