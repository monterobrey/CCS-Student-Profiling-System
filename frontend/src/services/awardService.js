import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const awardService = {
  // Dean / Chair / Secretary — GET /awards
  getAll: async () => httpClient.get(API_ENDPOINTS.AWARDS.LIST),

  // Chair — POST /awards
  give: async (data) => httpClient.post(API_ENDPOINTS.AWARDS.GIVE, data),

  // Dean / Chair — POST /awards/{id}/approve
  approve: async (id) => httpClient.post(API_ENDPOINTS.AWARDS.APPROVE(id), {}),

  // Dean / Chair — POST /awards/{id}/reject
  reject: async (id, reason = '') => httpClient.post(API_ENDPOINTS.AWARDS.REJECT(id), { reason }),

  // Faculty — GET /faculty/awards
  getFacultyAwards: async () => httpClient.get(API_ENDPOINTS.AWARDS.FACULTY_LIST),

  // Faculty — POST /faculty/awards
  giveByFaculty: async (data) => httpClient.post(API_ENDPOINTS.AWARDS.FACULTY_GIVE, data),

  // Student — GET /student/awards
  getMyAwards: async () => httpClient.get(API_ENDPOINTS.AWARDS.STUDENT_LIST),

  // Student — POST /student/awards
  apply: async (data) => httpClient.post(API_ENDPOINTS.AWARDS.STUDENT_APPLY, data),
};

export default awardService;
