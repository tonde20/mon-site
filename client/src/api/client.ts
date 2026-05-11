import axios from 'axios';

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });

export const ingredientsApi = {
  getAll: () => api.get('/ingredients').then(r => r.data),
  getLowStock: () => api.get('/ingredients/low-stock').then(r => r.data),
  create: (data: any) => api.post('/ingredients', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/ingredients/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/ingredients/${id}`).then(r => r.data),
  addMovement: (id: number, data: any) => api.post(`/ingredients/${id}/movements`, data).then(r => r.data),
  getMovements: (id: number) => api.get(`/ingredients/${id}/movements`).then(r => r.data),
};

export const productsApi = {
  getAll: () => api.get('/products').then(r => r.data),
  create: (data: any) => api.post('/products', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/products/${id}`).then(r => r.data),
};

export const ordersApi = {
  getAll: (status?: string) => api.get('/orders', { params: status ? { status } : {} }).then(r => r.data),
  getById: (id: number) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data: any) => api.post('/orders', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/orders/${id}`, data).then(r => r.data),
  updateStatus: (id: number, status: string) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
  delete: (id: number) => api.delete(`/orders/${id}`).then(r => r.data),
};

export const treasuryApi = {
  getAll: (month?: string) => api.get('/treasury', { params: month ? { month } : {} }).then(r => r.data),
  getSummary: (month?: string) => api.get('/treasury/summary', { params: month ? { month } : {} }).then(r => r.data),
  create: (data: any) => api.post('/treasury', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/treasury/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/treasury/${id}`).then(r => r.data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard').then(r => r.data),
};
