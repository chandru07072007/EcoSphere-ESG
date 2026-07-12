import api from './api';

// ============================================================
// ENVIRONMENTAL SERVICE
// ============================================================

// --- Carbon Transactions ---

export const getCarbonTransactions = async (params = {}) => {
  const response = await api.get('/environmental/carbon-transactions', { params });
  return response.data;
};

export const createCarbonTransaction = async (data) => {
  const response = await api.post('/environmental/carbon-transactions', data);
  return response.data;
};

export const updateCarbonTransaction = async (id, data) => {
  const response = await api.put(`/environmental/carbon-transactions/${id}`, data);
  return response.data;
};

export const deleteCarbonTransaction = async (id) => {
  const response = await api.delete(`/environmental/carbon-transactions/${id}`);
  return response.data;
};

// --- Carbon Tracking / Analytics ---

export const getCarbonTracking = async (params = {}) => {
  const response = await api.get('/environmental/carbon-tracking', { params });
  return response.data;
};

// --- Sustainability Goals ---

export const getGoals = async (params = {}) => {
  const response = await api.get('/environmental/goals', { params });
  return response.data;
};

export const createGoal = async (data) => {
  const response = await api.post('/environmental/goals', data);
  return response.data;
};

export const updateGoal = async (id, data) => {
  const response = await api.put(`/environmental/goals/${id}`, data);
  return response.data;
};

export const deleteGoal = async (id) => {
  const response = await api.delete(`/environmental/goals/${id}`);
  return response.data;
};

// --- Product Carbon Profiles ---

export const getProductProfiles = async () => {
  const response = await api.get('/environmental/product-profiles');
  return response.data;
};

export const createProductProfile = async (data) => {
  const response = await api.post('/environmental/product-profiles', data);
  return response.data;
};

export const updateProductProfile = async (id, data) => {
  const response = await api.put(`/environmental/product-profiles/${id}`, data);
  return response.data;
};

export const deleteProductProfile = async (id) => {
  const response = await api.delete(`/environmental/product-profiles/${id}`);
  return response.data;
};
