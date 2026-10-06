import api from './api';

export const createOrder = (payload) => api.post('/orders', payload).then((r) => r.data.data);
export const listOrders = () => api.get('/orders').then((r) => r.data.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data.data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status }).then((r) => r.data.data);
