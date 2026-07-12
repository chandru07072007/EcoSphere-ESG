import api from './api';

// ============================================================
// AUTH SERVICE
// ============================================================

/**
 * Login with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise} - { access_token, user }
 */
export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  
  const response = await api.post('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

/**
 * Register a new user.
 * @param {Object} userData - { name, email, password, department_id, role }
 * @returns {Promise}
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Get the currently authenticated user's profile.
 * @returns {Promise}
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Update the current user's profile.
 * @param {Object} data - Fields to update
 * @returns {Promise}
 */
export const updateMe = async (data) => {
  const response = await api.put('/auth/me', data);
  return response.data;
};
