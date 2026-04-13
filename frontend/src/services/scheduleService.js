import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const scheduleService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return httpClient.get(`${API_ENDPOINTS.SCHEDULE.LIST}${query ? `?${query}` : ''}`);
  },

  getCurriculumCourses: (sectionId) => {
    return httpClient.get(`${API_ENDPOINTS.SCHEDULE.CURRICULUM_COURSES}?section_id=${sectionId}`);
  },

  create: (data) => {
    return httpClient.post(API_ENDPOINTS.SCHEDULE.CREATE, data);
  },

  assignFaculty: (id, facultyId) => {
    return httpClient.post(API_ENDPOINTS.SCHEDULE.ASSIGN_FACULTY(id), { faculty_id: facultyId });
  },

  autoGenerate: (data) => {
    return httpClient.post(API_ENDPOINTS.SCHEDULE.AUTO_GENERATE, data);
  },

  bulkDelete: (ids) => {
    return httpClient.delete(API_ENDPOINTS.SCHEDULE.BULK_DELETE, {
      body: JSON.stringify({ ids }),
    });
  },

  destroy: (id) => {
    return httpClient.delete(API_ENDPOINTS.SCHEDULE.DELETE(id));
  },

  importCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULE.IMPORT}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      body: formData,
    }).then((res) => res.json());
  },
};

export default scheduleService;
