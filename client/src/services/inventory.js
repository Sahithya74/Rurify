import api from './api';

export const listMyInventory = () => api.get('/inventory').then((r) => r.data.data);
export const createInventory = (payload) => api.post('/inventory', payload).then((r) => r.data.data);
export const updateInventory = (id, payload) => api.put(`/inventory/${id}`, payload).then((r) => r.data.data);
export const deactivateInventory = (id) => api.delete(`/inventory/${id}`).then((r) => r.data.data);
export const importInventoryCsv = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/inventory/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
};
export const getSyncFeed = (since) => api.get('/inventory/sync', { params: { since } }).then((r) => r.data);
