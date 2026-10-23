import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('curo_token');
      if (token && !token.startsWith('demo_sa_token_')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage may be unavailable in some sandboxes
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message for frontend toast / notifications
    const serverMessage = error?.response?.data?.message;
    if (serverMessage && error.message) {
      error.message = serverMessage;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
