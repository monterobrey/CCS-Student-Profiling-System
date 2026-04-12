import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const violationService = {
  /**
   * Get all violations (Dean gets all, Chair/Secretary filtered by department)
   */
  getAll: async () => {
    return httpClient.get(API_ENDPOINTS.VIOLATIONS.LIST);
  },

  /**
   * Update violation status and action taken
   */
  update: async (id, data) => {
    return httpClient.put(API_ENDPOINTS.VIOLATIONS.UPDATE(id), data);
  },
};

export default violationService;
