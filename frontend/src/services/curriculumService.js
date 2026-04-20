import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const curriculumService = {
  /**
   * Get curriculum entries, optionally filtered by program_id (dean/secretary)
   */
  getAll: async (programId = null) => {
    const params = programId ? `?program_id=${programId}` : '';
    return httpClient.get(`${API_ENDPOINTS.CURRICULUM.LIST}${params}`);
  },

  /**
   * Get curriculum entries for the logged-in student (student role)
   */
  getForStudent: async (programId = null) => {
    const params = programId ? `?program_id=${programId}` : '';
    return httpClient.get(`${API_ENDPOINTS.CURRICULUM.STUDENT_LIST}${params}`);
  },

  /**
   * Bulk add courses to curriculum
   */
  bulkStore: async (payload) => {
    return httpClient.post(API_ENDPOINTS.CURRICULUM.BULK, payload);
  },

  /**
   * Import curriculum from CSV file
   */
  importCsv: async (file) => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CURRICULUM.IMPORT}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // No Content-Type — browser sets it with boundary for multipart
      },
      body: formData,
    });

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json() : {};
    return { ok: response.ok, status: response.status, ...data };
  },

  /**
   * Delete a curriculum entry by ID
   */
  delete: async (id) => {
    return httpClient.delete(API_ENDPOINTS.CURRICULUM.DELETE(id));
  },
};

export default curriculumService;
