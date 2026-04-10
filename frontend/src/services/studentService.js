/**
 * Student API Service
 * Handles all student-related API calls: list, create, update, delete, profile
 * 
 * Usage:
 * import { studentService } from './studentService';
 * const students = await studentService.getAll();
 * const newStudent = await studentService.create(studentData);
 */

import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const studentService = {
  /**
   * Get all students
   * @returns {Promise<Array>} - Array of student objects
   */
  getAll: async () => {
    return httpClient.get(API_ENDPOINTS.STUDENT.LIST);
  },

  /**
   * Get student by ID
   * @param {number} id - Student ID
   * @returns {Promise<Object>} - Student object
   */
  getById: async (id) => {
    return httpClient.get(API_ENDPOINTS.STUDENT.DETAIL(id));
  },

  /**
   * Get logged-in student's profile
   * @returns {Promise<Object>} - Current student profile
   */
  getProfile: async () => {
    return httpClient.get(API_ENDPOINTS.STUDENT.PROFILE);
  },

  /**
   * Create new student
   * @param {Object} studentData - Student data to create
   * @returns {Promise<Object>} - Created student object
   */
  create: async (studentData) => {
    return httpClient.post(API_ENDPOINTS.STUDENT.CREATE, studentData);
  },

  /**
   * Update student
   * @param {number} id - Student ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated student object
   */
  update: async (id, updateData) => {
    return httpClient.put(API_ENDPOINTS.STUDENT.UPDATE(id), updateData);
  },

  /**
   * Update logged-in student's profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated profile
   */
  updateProfile: async (profileData) => {
    return httpClient.post(API_ENDPOINTS.STUDENT.PROFILE, profileData);
  },

  /**
   * Delete student
   * @param {number} id - Student ID
   * @returns {Promise<Object>}
   */
  delete: async (id) => {
    return httpClient.delete(API_ENDPOINTS.STUDENT.DELETE(id));
  },

  /**
   * Import students from CSV
   * @param {File} csvFile - CSV file
   * @returns {Promise<Object>}
   */
  importFromCSV: async (csvFile) => {
    const formData = new FormData();
    formData.append('file', csvFile);

    return fetch(`http://localhost:8000/api${API_ENDPOINTS.STUDENT.IMPORT}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    }).then(res => res.json());
  },

  /**
   * Add skill to student
   * @param {number} studentId - Student ID
   * @param {Object} skillData - Skill data
   * @returns {Promise<Object>}
   */
  addSkill: async (studentId, skillData) => {
    return httpClient.post(API_ENDPOINTS.STUDENT.ADD_SKILL, skillData);
  },

  /**
   * Remove skill from student
   * @param {number} studentId - Student ID
   * @param {number} skillId - Skill ID
   * @returns {Promise<Object>}
   */
  removeSkill: async (studentId, skillId) => {
    return httpClient.delete(API_ENDPOINTS.STUDENT.REMOVE_SKILL(skillId));
  },

  /**
   * Get student's violations
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>}
   */
  getViolations: async (studentId) => {
    return httpClient.get(API_ENDPOINTS.STUDENT.VIOLATIONS);
  },
};

export default studentService;
