import api from './api';

export const listMyConnections = () => api.get('/connections').then((r) => r.data.data);
export const connectToVendor = (vendorId) => api.post('/connections', { vendorId }).then((r) => r.data.data);
