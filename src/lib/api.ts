import axios from 'axios';

const isLocalOrPreview = 
  typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('europe-west2.run.app')
  );

const api = axios.create({
  baseURL: isLocalOrPreview ? '/' : 'https://ais-pre-7k27idlqiut6loyap6cijp-722419689013.europe-west2.run.app',
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
