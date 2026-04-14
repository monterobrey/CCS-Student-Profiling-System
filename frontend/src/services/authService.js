/**
 * Authentication API Service
 * Handles all auth-related API calls: login, logout, setup password
 * 
 * Usage:
 * import { authService } from './authService';
 * const result = await authService.login(email, password);
 */

import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const authService = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (student, faculty, dean, etc.)
   * @returns {Promise<Object>} - { success, data: { token, user }, message }
   */
  login: async (email, password, role = 'student') => {
    return httpClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
      role,
    });
  },

  /**
   * Setup password on first login
   * @param {string} email - User email
   * @param {string} token - Setup token from email
   * @param {string} password - New password
   * @param {string} passwordConfirmation - Confirm password
   * @returns {Promise<Object>}
   */
  setupPassword: async (email, token, password, passwordConfirmation) => {
    return httpClient.post(API_ENDPOINTS.AUTH.SETUP_PASSWORD, {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  },

  /**
   * Logout current user
   * @returns {Promise<Object>}
   */
  logout: async () => {
    return httpClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
  },

  /**
   * Get current logged-in user
   * @returns {Promise<Object>} - { success, data: user, message }
   */
  getCurrentUser: async () => {
    return httpClient.get(API_ENDPOINTS.AUTH.CURRENT_USER);
  },
};

export default authService;
