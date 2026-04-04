import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Hardcoded for now
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // Increased to 30 seconds
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timeout. Server is taking too long to respond.',
        status: 0
      });
    }
    
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject({
        message: 'Cannot connect to server. Make sure the backend is running on http://localhost:5000',
        status: 0
      });
    }

    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      return Promise.reject({
        message: data.message || 'An error occurred',
        errors: data.errors || null,
        status
      });
    }

    return Promise.reject({
      message: error.message || 'An unexpected error occurred',
      status: 0
    });
  }
);

export default api;