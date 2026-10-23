import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor placeholder
api.interceptors.request.use(
  (config) => {
    // TODO: Attach auth tokens if using local storage or custom headers
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor placeholder
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle 401 unauthenticated redirect or refresh token logic
    return Promise.reject(error);
  }
);

export default api;
