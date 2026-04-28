import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const organizationService = {
  /**
   * Get all organizations
   * @returns {Promise<Array>} - Array of organization objects
   */
  getAll: async () => {
    return httpClient.get(API_ENDPOINTS.ORGANIZATIONS.LIST);
  },

  /**
   * Create new organization
   * @param {Object} orgData - Organization data
   * @returns {Promise<Object>} - Created organization
   */
  create: async (orgData) => {
    return httpClient.post(API_ENDPOINTS.ORGANIZATIONS.CREATE, orgData);
  },
};

export default organizationService;
