import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (originalRequest.url?.includes('/auth/refresh')) {
        window.location.href = '/sign-in';
        return Promise.reject(error);
      }

      try {
        await apiClient.post('/auth/refresh');
        return apiClient(originalRequest);
      } catch (refreshError) {
        window.location.href = '/sign-in';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    register: (data: RegisterData) => apiClient.post('/auth/register', data),
    login: (data: LoginData) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    refresh: () => apiClient.post('/auth/refresh'),
    me: () => apiClient.post('/auth/me'),
  },
  
  tasks: {
    create: (data: TaskData) => apiClient.post('/tasks/', data),
    list: (params?: { skip?: number; limit?: number; completed?: boolean }) => 
      apiClient.post('/tasks/list', params),
    get: (id: number) => apiClient.post(`/tasks/${id}/get`),
    update: (id: number, data: Partial<TaskData>) => 
      apiClient.post(`/tasks/${id}/update`, data),
    delete: (id: number) => apiClient.post(`/tasks/${id}/delete`),
  },
};

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface TaskData {
  title: string;
  description?: string;
  completed?: boolean;
  due_date?: string;
}