import api from './api';

export const applyToJobRequest = (jobId, coverLetter = '') =>
  api.post(`/applications/${jobId}`, { coverLetter }).then((res) => res.data);
export const getMyApplicationsRequest = () => api.get('/applications/me').then((res) => res.data);
export const updateApplicationStatusRequest = (id, status, note) =>
  api.patch(`/applications/${id}/status`, { status, note }).then((res) => res.data);
export const withdrawApplicationRequest = (id) => api.delete(`/applications/${id}`).then((res) => res.data);
export const getRecruiterPipelineRequest = () => api.get('/applications/recruiter/summary').then((res) => res.data);
