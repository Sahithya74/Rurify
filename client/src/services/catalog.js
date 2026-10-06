import api from './api';

export const listRegions = () => api.get('/regions').then((r) => r.data.data);
export const listCategories = () => api.get('/categories').then((r) => r.data.data);
export const listProducts = (params) => api.get('/products', { params }).then((r) => r.data.data);
export const getProduct = (id) => api.get(`/products/${id}`).then((r) => r.data.data);
export const searchProducts = (params) => api.get('/products/search', { params }).then((r) => r.data.data);
export const getSuppliersForProduct = (id, params) =>
  api.get(`/products/${id}/suppliers`, { params }).then((r) => r.data.data);
