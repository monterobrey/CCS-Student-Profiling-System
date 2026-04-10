/**
 * Course API Service
 * Handles all course-related API calls
 * 
 * Usage:
 * import { courseService } from './courseService';
 * const courses = await courseService.getAll();
 */

import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const courseService = {
  /**
   * Get all courses
   * @param {number} programId - Optional: Filter by program ID
   * @returns {Promise<Array>}
   */
  getAll: async (programId = null) => {
    const params = programId ? `?program_id=${programId}` : '';
    return httpClient.get(`${API_ENDPOINTS.COURSE.LIST}${params}`);
  },

  /**
   * Get course by ID
   * @param {number} id - Course ID
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return httpClient.get(API_ENDPOINTS.COURSE.DETAIL(id));
  },

  /**
   * Create new course
   * @param {Object} courseData
   * @returns {Promise<Object>}
   */
  create: async (courseData) => {
    return httpClient.post(API_ENDPOINTS.COURSE.CREATE, courseData);
  },

  /**
   * Update course
   * @param {number} id - Course ID
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  update: async (id, updateData) => {
    return httpClient.put(API_ENDPOINTS.COURSE.UPDATE(id), updateData);
  },

  /**
   * Delete course
   * @param {number} id - Course ID
   * @returns {Promise<Object>}
   */
  delete: async (id) => {
    return httpClient.delete(API_ENDPOINTS.COURSE.DELETE(id));
  },
};

export default courseService;
