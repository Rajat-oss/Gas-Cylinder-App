import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optional: check token validity with backend on mount
    setLoading(false);
  }, []);

  useEffect(() => {
    let intervalId;
    if (user) {
      // Send a ping immediately if user exists
      api.post('/auth/ping').catch(err => console.error('Ping failed', err));
      
      // Ping every 60 seconds to maintain real-time online status
      intervalId = setInterval(() => {
        api.post('/auth/ping').catch(() => {});
      }, 60000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error(error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
