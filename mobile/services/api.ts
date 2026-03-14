import axios from 'axios';
import { storage } from './storage';
import { Platform } from 'react-native';

/**
 * PRODUCTION-READY AXIOS INSTANCE
 * Handles base URL, timeouts, and automatic JWT injection.
 */
const getBaseURL = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5002/api';
    }
    // For mobile devices, use your machine's IP
    return 'http://10.235.139.142:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 10000,
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

        if (error.response?.status === 401 && !isLoginRequest) {
            // Signal a session expiry (component will handle the redirect via AuthContext)
            console.warn('[API] Unauthorized access - Session might be expired');
        }
        return Promise.reject(error);
    }
);

export default api;
