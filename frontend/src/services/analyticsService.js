import api from './api';

// ============================================================
// ANALYTICS SERVICE
// ============================================================

/**
 * Fetch a pre-built report by type.
 * @param {string} type - environmental | social | governance | summary
 * @param {Object} params - Optional query params (department_id, start_date, end_date)
 */
export const getReport = async (type, params = {}) => {
  const response = await api.get(`/analytics/report/${type}`, { params });
  return response.data;
};

/**
 * Build a custom report with granular filters.
 * @param {Object} filters - module, department_id, start_date, end_date
 */
export const buildCustomReport = async (filters) => {
  const response = await api.post('/analytics/custom-report', filters);
  return response.data;
};

/**
 * Export a report to a specific format (triggers download via S3 pre-signed URL or direct file download).
 * @param {string} reportType - environmental | social | governance
 * @param {string} format     - csv | excel | pdf
 * @param {Object} params     - Optional filters for the export
 */
export const exportReport = async (reportType, format, params = {}) => {
  const queryParams = new URLSearchParams({
    format,
    ...params
  }).toString();
  
  // Fetch as blob to ensure Authorization header is attached and file downloads correctly
  const response = await api.get(`/analytics/export/${reportType}?${queryParams}`, {
    responseType: 'blob'
  });

  // If response is actually JSON (e.g. S3 pre-signed URL payload returned)
  if (response.data.type === 'application/json') {
    const text = await response.data.text();
    const json = JSON.parse(text);
    if (json.download_url) {
      window.open(json.download_url, '_blank');
      return json;
    }
  }

  // Otherwise trigger download on the returned binary stream blob
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;

  // Attempt to parse filename from header
  const disposition = response.headers['content-disposition'];
  let filename = `${reportType}_report.${format === 'excel' ? 'xlsx' : format}`;
  if (disposition && disposition.includes('filename=')) {
    filename = disposition.split('filename=')[1].replace(/"/g, '');
  }

  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);

  return { success: true };
};

/**
 * Get ESG dashboard summary metrics from the dashboard controller.
 */
export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/overview');
  return response.data;
};