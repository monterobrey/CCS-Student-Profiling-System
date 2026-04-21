import { httpClient } from './httpClient';

export const notificationService = {
  getAll: () => httpClient.get('/notifications'),
  markRead: (id) => httpClient.post(`/notifications/${id}/read`, {}),
  markAllRead: () => httpClient.post('/notifications/read-all', {}),
};

export default notificationService;
