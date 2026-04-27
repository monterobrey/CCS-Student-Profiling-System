import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const eventService = {
  // All roles — GET /events
  getAll: async () => httpClient.get(API_ENDPOINTS.EVENTS.LIST),

  // Secretary — POST /events
  create: async (data) => httpClient.post(API_ENDPOINTS.EVENTS.CREATE, data),

  // Creator / Dean — DELETE /events/{id}
  remove: async (id) => httpClient.delete(API_ENDPOINTS.EVENTS.DELETE(id)),
};

export default eventService;
