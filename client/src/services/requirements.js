import api from './api';

export const createRequirement = (payload) => api.post('/requirements', payload).then((r) => r.data.data);
export const listRequirements = () => api.get('/requirements').then((r) => r.data.data);
export const getRequirement = (id) => api.get(`/requirements/${id}`).then((r) => r.data.data);
export const respondToRequirement = (id, payload) =>
  api.put(`/requirements/${id}/respond`, payload).then((r) => r.data.data);
export const getRequirementAggregate = (productId) =>
  api.get(`/requirements/aggregate/${productId}`).then((r) => r.data.data);
