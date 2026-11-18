import api from './api';

export const getJobRankingRequest = (jobId) => api.get(`/matches/job/${jobId}`).then((res) => res.data);
export const getRecommendationsRequest = (limit = 8) =>
  api.get('/matches/recommendations', { params: { limit } }).then((res) => res.data);
export const getJobStatisticsRequest = (jobId) =>
  api.get(`/matches/job/${jobId}/statistics`).then((res) => res.data);
