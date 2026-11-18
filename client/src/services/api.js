import axios from 'axios';

export const TOKEN_KEY = 'ra_token';
export const USER_KEY = 'ra_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('ra:unauthenticated'));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the API. Make sure the backend is running on port 5000.';
  }
  return error?.message || 'Something went wrong. Please try again.';
};

export default api;
