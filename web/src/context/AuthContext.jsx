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
      // Send a ping immediately if user exists to mark as online
      // We use a separate effect for interval to avoid restarting it on every user object reference change
      const sendPing = () => api.post('/auth/ping').catch(() => {});
      
      sendPing();
      
      // Ping every 60 seconds to maintain real-time online status
      intervalId = setInterval(sendPing, 60000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.id]); // Only re-run if the user ID changes, not on every object update

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
