import api from './api';

export const listJobsRequest = (params = {}) => api.get('/jobs', { params }).then((res) => res.data);
export const getJobRequest = (id) => api.get(`/jobs/${id}`).then((res) => res.data);
export const createJobRequest = (payload) => api.post('/jobs', payload).then((res) => res.data);
export const updateJobRequest = (id, payload) => api.put(`/jobs/${id}`, payload).then((res) => res.data);
export const deleteJobRequest = (id) => api.delete(`/jobs/${id}`).then((res) => res.data);
export const getJobApplicantsRequest = (id) => api.get(`/jobs/${id}/applicants`).then((res) => res.data);
export const getSkillFacetsRequest = () => api.get('/jobs/meta/skills').then((res) => res.data);
