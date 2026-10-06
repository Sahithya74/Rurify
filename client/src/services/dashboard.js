import api from './api';

export const getRetailerDashboard = () => api.get('/dashboard/retailer').then((r) => r.data.data);
export const getVendorDashboard = () => api.get('/dashboard/vendor').then((r) => r.data.data);
