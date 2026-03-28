import axios from 'axios';
import { storage } from './storage';

// Development detection - __DEV__ is true in development builds, false in production
const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;

// API URL configuration - Always use production backend
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gas-cylinder-app.onrender.com';

// NOTE: Backend routes use /api prefix
const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attaches the Bearer token to every request if it exists.
 */
api.interceptors.request.use(
    async (config) => {
        const token = await storage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Intercepts errors globally. If a 401 is detected, we can handle it here or in the component.
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        const isLogoutRequest = error.config?.url?.includes('/auth/logout');

        if (error.response?.status === 401 && !isLoginRequest && !isLogoutRequest) {
            // Clear stored credentials on 401
            const { storage } = require('./storage');
            await storage.deleteItem('token');
            await storage.deleteItem('user');
            console.warn('[API] Session expired - Credentials cleared');
        }
        
        // Handle network errors
        if (!error.response) {
            console.error('[API] Network error:', error.message);
            error.message = 'Network error. Please check your connection.';
        }
        
        return Promise.reject(error);
    }
);

export const updateOnlineStatus = (isOnline: boolean) =>
    api.patch('/staff/status', { isOnline });

export default api;
