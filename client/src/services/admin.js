import api from './api';

export const listUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data.data);
export const setUserActive = (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }).then((r) => r.data.data);

export const listVendors = () => api.get('/admin/vendors').then((r) => r.data.data);
export const verifyVendor = (id, verified) => api.put(`/admin/vendors/${id}/verify`, { verified }).then((r) => r.data.data);
export const getVendorPerformance = (id) => api.get(`/admin/vendors/${id}/performance`).then((r) => r.data.data);
export const getVendorProducts = (id) => api.get(`/admin/vendors/${id}/products`).then((r) => r.data.data);

export const listRetailers = () => api.get('/admin/retailers').then((r) => r.data.data);
export const verifyRetailer = (id, verified) => api.put(`/admin/retailers/${id}/verify`, { verified }).then((r) => r.data.data);
export const getRetailerActivity = (id) => api.get(`/admin/retailers/${id}/activity`).then((r) => r.data.data);

export const listAdminCategories = () => api.get('/admin/categories').then((r) => r.data.data);
export const createCategory = (name) => api.post('/admin/categories', { name }).then((r) => r.data.data);
export const listAdminProducts = () => api.get('/admin/products').then((r) => r.data.data);

export const listAdminOrders = (params) => api.get('/admin/orders', { params }).then((r) => r.data.data);
export const listAdminRequirements = (params) => api.get('/admin/requirements', { params }).then((r) => r.data.data);
export const getDemandAnalytics = () => api.get('/admin/analytics/demand').then((r) => r.data.data);
export const listAuditLogs = () => api.get('/admin/audit-logs').then((r) => r.data.data);
