import axios from 'axios';
import { storage } from './storage';

/**
 * PRODUCTION-READY AXIOS INSTANCE
 * Handles base URL, timeouts, and automatic JWT injection.
 */
const api = axios.create({
    // Replace with your local machine's IP address (e.g., 192.168.x.x)
    baseURL: 'http://10.165.240.142:5000',
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
        if (error.response?.status === 401) {
            // Signal a session expiry (component will handle the redirect via AuthContext)
            console.warn('[API] Unauthorized access - Session might be expired');
        }
        return Promise.reject(error);
    }
);

export default api;
