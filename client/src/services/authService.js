import api from './api';

export const registerRequest = (payload) => api.post('/auth/register', payload).then((res) => res.data);
export const loginRequest = (payload) => api.post('/auth/login', payload).then((res) => res.data);
export const meRequest = () => api.get('/auth/me').then((res) => res.data);
export const updateProfileRequest = (payload) => api.put('/auth/profile', payload).then((res) => res.data);
export const changePasswordRequest = (payload) => api.put('/auth/password', payload).then((res) => res.data);
