import api from './api';

export const listNotifications = () => api.get('/notifications').then((r) => r.data.data);
export const getUnreadCount = () => api.get('/notifications/unread-count').then((r) => r.data.data.count);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`).then((r) => r.data.data);
export const markAllRead = () => api.put('/notifications/read-all').then((r) => r.data.data);
