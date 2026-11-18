import api from './api';

export const uploadResumeRequest = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('resume', file);
  return api
    .post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((res) => res.data);
};

export const getMyResumeRequest = () => api.get('/resumes/me').then((res) => res.data);
export const getResumeRequest = (id) => api.get(`/resumes/${id}`).then((res) => res.data);
export const getCandidateResumeRequest = (candidateId) =>
  api.get(`/resumes/candidate/${candidateId}`).then((res) => res.data);
export const reanalyzeResumeRequest = (id) => api.post(`/resumes/${id}/reanalyze`).then((res) => res.data);
export const deleteResumeRequest = (id) => api.delete(`/resumes/${id}`).then((res) => res.data);

export const downloadResumeFile = async (id, filename = 'resume.pdf') => {
  const response = await api.get(`/resumes/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
