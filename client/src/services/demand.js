import api from './api';

export const getTopProducts = (params) => api.get('/demand/top-products', { params }).then((r) => r.data.data);
export const getRegionalDemand = () => api.get('/demand/regional').then((r) => r.data.data);
export const getDemandForProduct = (id, params) =>
  api.get(`/demand/product/${id}`, { params }).then((r) => r.data.data);
export const getRecommendations = () => api.get('/recommendations').then((r) => r.data.data);
