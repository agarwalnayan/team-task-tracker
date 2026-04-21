import axios from 'axios';

// Get your PC's IP from server console or ipconfig
// Example: 192.168.1.x (check what your PC shows in ipconfig)
const BACKEND_IP = window.localStorage.getItem('backend_ip') || '192.168.1.89';

const getBaseURL = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  console.log('[getBaseURL] Hostname:', hostname, 'Is localhost:', isLocalhost);
  
  if (!isLocalhost) {
    // When accessing from another device, use the SAME hostname as the frontend
    // but with port 5000 for the backend
    const url = `http://${hostname}:5000`;
    console.log('[getBaseURL] Network mode URL:', url);
    return url;
  }
  
  console.log('[getBaseURL] Localhost mode');
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // Increased to 30 seconds
  withCredentials: false  // Changed to false for cross-origin
});

// DEBUG: Log the actual baseURL being used
console.log('🔌 API Base URL:', api.defaults.baseURL);
console.log('📱 Current hostname:', window.location.hostname);

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
      const serverUrl = api.defaults.baseURL;
      return Promise.reject({
        message: `Cannot connect to server at ${serverUrl}.\n\nPlease check:\n1. Backend is running (node server)\n2. Same WiFi/network for both devices\n3. Firewall allows port 5000\n4. Using correct IP: ${serverUrl}`,
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