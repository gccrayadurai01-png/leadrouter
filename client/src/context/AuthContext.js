import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Use empty string for relative paths in production, localhost for development
const API_URL = process.env.REACT_APP_API_URL !== undefined 
  ? process.env.REACT_APP_API_URL 
  : 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token) {
      // Set axios header with existing token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to set user from localStorage immediately (optimistic)
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (e) {
          // Invalid saved user, clear it
          localStorage.removeItem('user');
        }
      }
      
      // Verify token is still valid by fetching user
      fetchUser();
    } else {
      // No token - set mock user for development/bypass mode
      setUser({
        id: '1',
        email: 'admin@leadrouter.com',
        role: 'admin',
        name: 'Admin User'
      });
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

