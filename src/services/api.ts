import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('tenantName')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  signup: (data: { userName: string; companyName: string; email: string; password: string }) =>
    apiClient.post('/auth/signup', data),
  register: (data: { name: string; email: string; password: string; tenantId: string; role: string }) =>
    apiClient.post('/auth/register', data),
  refresh: (data: { token: string; refreshToken: string }) =>
    apiClient.post('/auth/refresh', data),
}

export const ticketService = {
  getAll: (params?: { status?: string; priority?: string; page?: number; pageSize?: number }) =>
    // Pages filter/sort/paginate client-side over the full tenant ticket list,
    // so fetch generously — the API pages in-memory and this keeps that list complete.
    apiClient.get('/tickets', { params: { page: 1, pageSize: 1000, ...params } }),
  getById: (id: string) =>
    apiClient.get(`/tickets/${id}`),
  create: (data: any) =>
    apiClient.post('/tickets', data),
  update: (id: string, data: any) =>
    apiClient.put(`/tickets/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/tickets/${id}`),
}

export const featureService = {
  getAll: (params?: { projectId?: string }) =>
    apiClient.get('/features', { params }),
  getById: (id: string) =>
    apiClient.get(`/features/${id}`),
  create: (data: any) =>
    apiClient.post('/features', data),
  update: (id: string, data: any) =>
    apiClient.put(`/features/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/features/${id}`),
}

export const todoService = {
  getAll: (params?: { status?: string; myTodosOnly?: boolean }) =>
    apiClient.get('/todos', { params }),
  create: (data: any) =>
    apiClient.post('/todos', data),
  update: (id: string, data: any) =>
    apiClient.put(`/todos/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/todos/${id}`),
}

export const userService = {
  getTenantUsers: () =>
    apiClient.get('/users/tenant'),
}

export const dashboardService = {
  getMetrics: (params?: { projectId?: string }) =>
    apiClient.get('/dashboard/metrics', { params }),
  getBugTrend: () =>
    apiClient.get('/dashboard/bug-trend'),
  getPriorityDistribution: () =>
    apiClient.get('/dashboard/priority-distribution'),
}

export default apiClient

export const sprintService = {
  getAll: () => apiClient.get('/sprints'),
  create: (data: any) => apiClient.post('/sprints', data),
  update: (id: string, data: any) => apiClient.put(`/sprints/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sprints/${id}`),
}
