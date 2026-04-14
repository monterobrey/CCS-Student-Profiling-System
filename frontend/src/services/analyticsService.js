/**
 * Analytics API Service
 * Handles dashboard and analytics API calls
 * 
 * Usage:
 * import { analyticsService } from './analyticsService';
 * const summary = await analyticsService.getDeanSummary();
 */

import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const analyticsService = {
  /**
   * Get dean/admin dashboard summary
   * @returns {Promise<Object>}
   */
  getDeanSummary: async () => {
    return httpClient.get(API_ENDPOINTS.ANALYTICS.SUMMARY);
  },

  /**
   * Get faculty dashboard summary
   * @returns {Promise<Object>}
   */
  getFacultySummary: async () => {
    return httpClient.get(API_ENDPOINTS.ANALYTICS.FACULTY);
  },

  /**
   * Get academic performance statistics
   * @returns {Promise<Object>}
   */
  getAcademicPerformance: async () => {
    return httpClient.get(API_ENDPOINTS.ANALYTICS.PERFORMANCE);
  },

  /**
   * Get profiling report with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>}
   */
  getProfiling: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return httpClient.get(`${API_ENDPOINTS.PROFILING.REPORT}${queryString ? '?' + queryString : ''}`);
  },
};

export default analyticsService;
