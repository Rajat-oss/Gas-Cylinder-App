import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import api from '../services/api';
import { storage } from '../services/storage';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'DRIVER' | 'STAFF';
    phone: string;
    vehicleNumber?: string;
    licenseNumber?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            const storedToken = await storage.getItem('token');
            const storedUser = await storage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        }
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/login', { email, password });
            const { token, user: loggedUser } = response.data;

            if (loggedUser.role !== 'DRIVER' && loggedUser.role !== 'STAFF') {
                Alert.alert('Access Denied', 'Only drivers can use this app.');
                return false;
            }

            await storage.setItem('token', token);
            await storage.setItem('user', JSON.stringify(loggedUser));

            setToken(token);
            setUser(loggedUser);
            router.replace('/(tabs)' as any);
            return true;
        } catch (error: any) {
            console.error('Login error:', error);
            let msg = 'Login failed. Please check your credentials.';
            
            if (error.response?.data?.message) {
                msg = error.response.data.message;
            } else if (error.message?.includes('Network error')) {
                msg = 'Network error. Please check your internet connection.';
            } else if (!error.response) {
                msg = 'Unable to connect to server. Please try again later.';
            }
            
            Alert.alert('Login Failed', msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        // Clear local data first to prevent any API calls
        await storage.deleteItem('token');
        await storage.deleteItem('user');
        setToken(null);
        setUser(null);
        
        // Navigate to login immediately
        router.replace('/(auth)/login' as any);
        
        // Try to notify backend about logout in background (optional)
        try {
            if (token) {
                await api.post('/auth/logout');
            }
        } catch (error) {
            // Silently ignore backend logout errors
            console.log('Backend logout notification failed (expected)');
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
