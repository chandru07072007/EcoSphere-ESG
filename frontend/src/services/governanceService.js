import api from './api';

// ============================================================
// GOVERNANCE SERVICE
// ============================================================

// --- Compliance Issues ---

export const getComplianceIssues = async (params = {}) => {
  const response = await api.get('/governance/compliance-issues', { params });
  return response.data;
};

export const createComplianceIssue = async (data) => {
  const response = await api.post('/governance/compliance-issues', data);
  return response.data;
};

export const updateComplianceIssue = async (id, data) => {
  const response = await api.put(`/governance/compliance-issues/${id}`, data);
  return response.data;
};

export const deleteComplianceIssue = async (id) => {
  const response = await api.delete(`/governance/compliance-issues/${id}`);
  return response.data;
};

export const getOverdueIssues = async () => {
  const response = await api.get('/governance/compliance-issues/overdue');
  return response.data;
};

// --- Policies ---

export const getPolicies = async (params = {}) => {
  const response = await api.get('/governance/policies', { params });
  return response.data;
};

export const createPolicy = async (data) => {
  const response = await api.post('/governance/policies', data);
  return response.data;
};

export const updatePolicy = async (id, data) => {
  const response = await api.put(`/governance/policies/${id}`, data);
  return response.data;
};

export const publishPolicy = async (id) => {
  const response = await api.post(`/governance/policies/${id}/publish`);
  return response.data;
};

export const acknowledgePolicy = async (id) => {
  const response = await api.post(`/governance/policies/${id}/acknowledge`);
  return response.data;
};

export const getPolicyAcknowledgements = async (policyId) => {
  const response = await api.get(`/governance/policies/${policyId}/acknowledgements`);
  return response.data;
};

// --- Audits ---

export const getAudits = async (params = {}) => {
  const response = await api.get('/governance/audits', { params });
  return response.data;
};

export const createAudit = async (data) => {
  const response = await api.post('/governance/audits', data);
  return response.data;
};

export const updateAudit = async (id, data) => {
  const response = await api.put(`/governance/audits/${id}`, data);
  return response.data;
};

// --- Policy management helpers not covered above
export const deletePolicy = async (id) => {
  const response = await api.delete(`/governance/policies/${id}`);
  return response.data;
};
