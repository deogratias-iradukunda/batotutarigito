import axios from 'axios';

const isLocalOrPreview = true;

const api = axios.create({
  baseURL: '/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data && typeof data === 'object') {
        let resolvedErrorString = "";
        if (data.error) {
          if (typeof data.error === 'string') {
            resolvedErrorString = data.error;
          } else if (typeof data.error === 'object') {
            resolvedErrorString = data.error.message || data.error.code || JSON.stringify(data.error);
          }
        } else if (data.message && typeof data.message === 'string') {
          resolvedErrorString = data.message;
        } else if (data.code) {
          resolvedErrorString = `Error code: ${data.code}`;
        }
        
        if (resolvedErrorString) {
          error.response.data.error = resolvedErrorString;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
