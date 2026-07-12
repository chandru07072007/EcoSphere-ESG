import api from './api';

// ============================================================
// SOCIAL SERVICE
// ============================================================

// --- CSR Activities ---

export const getCSRActivities = async (params = {}) => {
  const response = await api.get('/social/csr-activities', { params });
  return response.data;
};

export const createCSRActivity = async (data) => {
  const response = await api.post('/social/csr-activities', data);
  return response.data;
};

export const updateCSRActivity = async (id, data) => {
  const response = await api.put(`/social/csr-activities/${id}`, data);
  return response.data;
};

export const participateInCSR = async (id, data = {}) => {
  const response = await api.post(`/social/csr-activities/${id}/participate`, data);
  return response.data;
};

export const uploadProof = async (participationId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(
    `/social/csr-participations/${participationId}/upload-proof`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const approveParticipation = async (id) => {
  const response = await api.post(`/social/csr-participations/${id}/approve`);
  return response.data;
};

export const denyParticipation = async (id) => {
  const response = await api.post(`/social/csr-participations/${id}/deny`);
  return response.data;
};

// --- Challenges ---

export const getChallenges = async (params = {}) => {
  const response = await api.get('/social/challenges', { params });
  return response.data;
};

export const createChallenge = async (data) => {
  const response = await api.post('/social/challenges', data);
  return response.data;
};

export const updateChallengeStatus = async (id, status) => {
  const response = await api.put(`/social/challenges/${id}/status`, { status });
  return response.data;
};

export const participateInChallenge = async (id) => {
  const response = await api.post(`/social/challenges/${id}/participate`);
  return response.data;
};

export const completeChallenge = async (participationId) => {
  const response = await api.put(`/social/challenge-participations/${participationId}/complete`);
  return response.data;
};

// --- Leaderboard ---

export const getLeaderboard = async (params = {}) => {
  const response = await api.get('/social/leaderboard', { params });
  return response.data;
};

// --- Rewards ---

export const getRewards = async (params = {}) => {
  const response = await api.get('/social/rewards', { params });
  return response.data;
};

export const redeemReward = async (id) => {
  const response = await api.post(`/social/rewards/${id}/redeem`);
  return response.data;
};

// --- Badges & XP ---

export const getEmployeeBadges = async (employeeId) => {
  const response = await api.get(`/social/employee/${employeeId}/badges`);
  return response.data;
};

export const getEmployeeXpHistory = async (employeeId) => {
  const response = await api.get(`/social/employee/${employeeId}/xp-history`);
  return response.data;
};