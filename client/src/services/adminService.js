import api from './api';

export const getDashboardStatsRequest = () => api.get('/admin/stats').then((res) => res.data);
export const listUsersRequest = (params) => api.get('/admin/users', { params }).then((res) => res.data);
export const toggleUserStatusRequest = (id) => api.patch(`/admin/users/${id}/status`).then((res) => res.data);
