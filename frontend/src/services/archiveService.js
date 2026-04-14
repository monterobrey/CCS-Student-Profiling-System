import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const archiveService = {
  getArchived: async () => {
    return httpClient.get(API_ENDPOINTS.ARCHIVE.LIST);
  },

  restoreAccount: async (id, type) => {
    return httpClient.post(API_ENDPOINTS.ARCHIVE.RESTORE(id), { type });
  },
};

export default archiveService;
