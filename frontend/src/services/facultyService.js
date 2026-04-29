/**
 * Faculty API Service
 * Handles all faculty-related API calls
 * 
 * Usage:
 * import { facultyService } from './facultyService';
 * const faculty = await facultyService.getAll();
 */

import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const facultyService = {
  /**
   * Get all faculty members
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    return httpClient.get(API_ENDPOINTS.FACULTY.LIST);
  },

  /**
   * Get faculty by ID
   * @param {number} id - Faculty ID
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return httpClient.get(`/faculty/${id}`);
  },

  /**
   * Create new faculty
   * @param {Object} facultyData
   * @returns {Promise<Object>}
   */
  create: async (facultyData) => {
    return httpClient.post(API_ENDPOINTS.FACULTY.CREATE, facultyData);
  },

  /**
   * Update faculty
   * @param {number} id - Faculty ID
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  update: async (id, updateData) => {
    return httpClient.put(API_ENDPOINTS.FACULTY.UPDATE(id), updateData);
  },

  /**
   * Delete faculty
   * @param {number} id - Faculty ID
   * @returns {Promise<Object>}
   */
  delete: async (id) => {
    return httpClient.delete(API_ENDPOINTS.FACULTY.DELETE(id));
  },

  /**
   * Get students taught by logged-in faculty
   * @returns {Promise<Array>}
   */
  getMyStudents: async (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const endpoint = query.toString()
      ? `${API_ENDPOINTS.FACULTY.MY_STUDENTS}?${query.toString()}`
      : API_ENDPOINTS.FACULTY.MY_STUDENTS;

    return httpClient.get(endpoint);
  },

  /**
   * Get schedule assigned to the logged-in faculty
   * @returns {Promise<Array>}
   */
  getMySchedule: async () => {
    return httpClient.get(API_ENDPOINTS.FACULTY.MY_SCHEDULE);
  },

  /**
   * Get students of a section taught by the faculty
   * @param {number|string} sectionId
   * @returns {Promise<Array>}
   */
  getSectionStudents: async (sectionId) => {
    return httpClient.get(API_ENDPOINTS.FACULTY.SECTION_STUDENTS(sectionId));
  },

  /**
   * Get violations reported by logged-in faculty
   * @returns {Promise<Array>}
   */
  getMyViolations: async () => {
    return httpClient.get(API_ENDPOINTS.FACULTY.MY_VIOLATIONS);
  },

  /**
   * Report student violation
   * @param {Object} violationData
   * @returns {Promise<Object>}
   */
  reportViolation: async (violationData) => {
    return httpClient.post(API_ENDPOINTS.FACULTY.REPORT_VIOLATION, violationData);
  },

  /**
   * Resend setup email to a pending faculty member
   */
  resendSetup: async (id) => {
    return httpClient.post(API_ENDPOINTS.FACULTY.RESEND_SETUP(id), {});
  },

  /**
   * Import faculty from CSV
   * @param {File} csvFile
   * @returns {Promise<Object>}
   */
  importFromCSV: async (csvFile) => {
    const formData = new FormData();
    formData.append('file', csvFile);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    return fetch(`${API_BASE_URL}${API_ENDPOINTS.FACULTY.IMPORT}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    }).then(res => res.json());
  },
};

export default facultyService;
