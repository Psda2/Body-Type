import axios from 'axios';
import { getAuthToken } from '../utils/storage';

// Base URL - change this to your backend URL
// For Android emulator: http://10.0.2.2:8001
// For iOS simulator: http://localhost:8001
// For physical device: http://YOUR_COMPUTER_IP:8001
// Replace with your machine's IP if testing on physical device
const BASE_URL = 'http://192.168.43.151:8001'; // User Local IP (Updated to match current network)

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  // Login
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${BASE_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  // Register (if endpoint exists)
  register: async (userData) => {
    const response = await axios.post(`${BASE_URL}/register`, userData);
    return response.data;
  },
};

export const bodyTypeAPI = {
  // Predict body type
  predict: async (measurements) => {
    const response = await api.post('/body-type/predict', measurements);
    return response.data;
  },
};

export const mealPlanAPI = {
  // Generate meal plan
  generate: async (profile, days = 1, goal = 'Healthy Living') => {
    // Add goal to profile
    const profileWithGoal = { ...profile, goal };
    
    const response = await api.post('/meal-plan/generate', {
      profile: profileWithGoal,
      plan_days: days,
    });
    return response.data;
  },

  // Get current active meal plan
  getCurrent: async () => {
    const response = await api.get('/meal-plan/current');
    return response.data;
  },
};

export const historyAPI = {
  // Get measurement history
  getAll: async () => {
    const response = await api.get('/measurements/history');
    return response.data;
  },
};

export const chatAPI = {
  // Send chat message
  sendMessage: async (query) => {
    const response = await api.post('/chat', { query });
    return response.data;
  },

  // Get chat history
  getHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },
};

export const userAPI = {
  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.post('/users/profile', profileData);
    return response.data;
  },
};

export const tipsAPI = {
  // Get daily tips
  getDaily: async () => {
    const response = await api.get('/tips/daily');
    return response.data;
  },
};

export default api;
