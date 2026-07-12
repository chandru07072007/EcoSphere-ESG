import api from './api';

// ============================================================
// MASTER DATA SERVICE
// Full CRUD for: departments, categories, emissionFactors, badges, rewards, settings
// ============================================================

// --- DEPARTMENTS ---

export const getDepartments = async (params = {}) => {
  const response = await api.get('/master/departments', { params });
  return response.data;
};

export const createDepartment = async (data) => {
  const response = await api.post('/master/departments', data);
  return response.data;
};

export const updateDepartment = async (id, data) => {
  const response = await api.put(`/master/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(`/master/departments/${id}`);
  return response.data;
};

// --- CATEGORIES ---

export const getCategories = async (params = {}) => {
  const response = await api.get('/master/categories', { params });
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/master/categories', data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/master/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/master/categories/${id}`);
  return response.data;
};

// --- EMISSION FACTORS ---

export const getEmissionFactors = async (params = {}) => {
  const response = await api.get('/master/emission-factors', { params });
  return response.data;
};

export const createEmissionFactor = async (data) => {
  const response = await api.post('/master/emission-factors', data);
  return response.data;
};

export const updateEmissionFactor = async (id, data) => {
  const response = await api.put(`/master/emission-factors/${id}`, data);
  return response.data;
};

export const deleteEmissionFactor = async (id) => {
  const response = await api.delete(`/master/emission-factors/${id}`);
  return response.data;
};

// --- BADGES ---

export const getBadges = async (params = {}) => {
  const response = await api.get('/master/badges', { params });
  return response.data;
};

export const createBadge = async (data) => {
  const response = await api.post('/master/badges', data);
  return response.data;
};

export const updateBadge = async (id, data) => {
  const response = await api.put(`/master/badges/${id}`, data);
  return response.data;
};

export const deleteBadge = async (id) => {
  const response = await api.delete(`/master/badges/${id}`);
  return response.data;
};

// --- REWARDS ---

export const getRewardsMasterData = async (params = {}) => {
  const response = await api.get('/master/rewards', { params });
  return response.data;
};

export const createRewardMasterData = async (data) => {
  const response = await api.post('/master/rewards', data);
  return response.data;
};

export const updateRewardMasterData = async (id, data) => {
  const response = await api.put(`/master/rewards/${id}`, data);
  return response.data;
};

export const deleteRewardMasterData = async (id) => {
  const response = await api.delete(`/master/rewards/${id}`);
  return response.data;
};

// --- SETTINGS / BUSINESS RULES ---

export const getBusinessSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateBusinessSettings = async (data) => {
  const response = await api.put('/settings', data);
  return response.data;
};