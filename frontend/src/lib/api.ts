import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data: { email: string; password: string; slug?: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// Clientes
export const clientsApi = {
  list: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  remove: (id: string) => api.delete(`/clients/${id}`),
  uploadFile: (id: string, formData: FormData) => api.post(`/clients/${id}/files`, formData),
  removeFile: (id: string, fileId: string) => api.delete(`/clients/${id}/files/${fileId}`),
};

// Pedidos
export const ordersApi = {
  list: (params?: any) => api.get('/orders', { params }),
  kanban: () => api.get('/orders/kanban'),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  remove: (id: string) => api.delete(`/orders/${id}`),
  addItem: (id: string, data: any) => api.post(`/orders/${id}/items`, data),
  updateItem: (id: string, itemId: string, data: any) => api.put(`/orders/${id}/items/${itemId}`, data),
  removeItem: (id: string, itemId: string) => api.delete(`/orders/${id}/items/${itemId}`),
};

// Artes
export const artsApi = {
  list: (params?: any) => api.get('/arts', { params }),
  getById: (id: string) => api.get(`/arts/${id}`),
  create: (data: any) => api.post('/arts', data),
  update: (id: string, data: any) => api.put(`/arts/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/arts/${id}/status`, { status }),
  addVersion: (id: string, formData: FormData) => api.post(`/arts/${id}/versions`, formData),
  approve: (id: string, approvedBy: string) => api.post(`/arts/${id}/approve`, { approvedBy }),
  requestAdjustment: (id: string, feedback: string) => api.post(`/arts/${id}/request-adjustment`, { feedback }),
};

// Matrizes
export const matricesApi = {
  list: (params?: any) => api.get('/matrices', { params }),
  getById: (id: string) => api.get(`/matrices/${id}`),
  create: (formData: FormData) => api.post('/matrices', formData),
  update: (id: string, data: any) => api.put(`/matrices/${id}`, data),
  remove: (id: string) => api.delete(`/matrices/${id}`),
};

// Produção
export const productionApi = {
  list: (params?: any) => api.get('/production', { params }),
  queue: () => api.get('/production/queue'),
  getById: (id: string) => api.get(`/production/${id}`),
  create: (data: any) => api.post('/production', data),
  update: (id: string, data: any) => api.put(`/production/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/production/${id}/status`, { status }),
  updateStep: (id: string, stepId: string, status: string) => api.patch(`/production/${id}/steps/${stepId}`, { status }),
};

// Financeiro
export const financialApi = {
  list: (params?: any) => api.get('/financial', { params }),
  summary: (params?: any) => api.get('/financial/summary', { params }),
  create: (data: any) => api.post('/financial', data),
  update: (id: string, data: any) => api.put(`/financial/${id}`, data),
  markAsPaid: (id: string) => api.patch(`/financial/${id}/pay`),
  remove: (id: string) => api.delete(`/financial/${id}`),
  addPayment: (orderId: string, data: any) => api.post(`/financial/orders/${orderId}/payment`, data),
};

// Produtos
export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  lowStock: () => api.get('/products/low-stock'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  adjustStock: (id: string, data: any) => api.post(`/products/${id}/stock`, data),
};

// Tenant
export const tenantApi = {
  me: () => api.get('/tenants/me'),
  update: (data: any) => api.put('/tenants/me', data),
  getUsers: () => api.get('/tenants/users'),
  createUser: (data: any) => api.post('/tenants/users', data),
  updateUser: (id: string, data: any) => api.put(`/tenants/users/${id}`, data),
};

// Máquinas
export const machinesApi = {
  list: () => api.get('/machines'),
  create: (data: any) => api.post('/machines', data),
  update: (id: string, data: any) => api.put(`/machines/${id}`, data),
};
