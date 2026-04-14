import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const profilingService = {
  /**
   * Generate profiling report with filters.
   * Strips empty values before sending so the backend only filters on what's set.
   */
  generateReport: async (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        params.append(key, val);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get(`${API_ENDPOINTS.PROFILING.REPORT}${query}`);
  },
};

export default profilingService;
