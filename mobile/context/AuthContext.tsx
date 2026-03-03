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
            const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
            Alert.alert('Error', msg);
            return false;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Silently fail if backend logout fails
        }
        await storage.deleteItem('token');
        await storage.deleteItem('user');
        setToken(null);
        setUser(null);
        router.replace('/(auth)/login' as any);
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
