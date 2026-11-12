'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isHealthcareProfessional: boolean;
  loginAsDemoUser: (role: 'public' | 'healthcare_professional') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('retinaguard_token');
    const savedUser = localStorage.getItem('retinaguard_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('retinaguard_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('retinaguard_token', data.access_token);
    localStorage.setItem('retinaguard_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('retinaguard_token');
    localStorage.removeItem('retinaguard_user');
  };

  const loginAsDemoUser = async (role: 'public' | 'healthcare_professional') => {
    // Check if test account exists, if not register then login
    const email = role === 'healthcare_professional' ? 'dr.sharma@health.gov.in' : 'screening.user@rural.org';
    const password = 'RetinaPassword123!';
    const fullName = role === 'healthcare_professional' ? 'Dr. Priya Sharma, MD' : 'Ramesh Kumar (PHC Screening)';
    const facility = role === 'healthcare_professional' ? 'District Hospital & Tele-Retina Hub' : 'Sonipat Primary Health Centre (PHC)';

    try {
      await login(email, password);
    } catch {
      // Register demo user
      await api.register({
        email,
        password,
        full_name: fullName,
        role,
        facility_name: facility,
      });
      await login(email, password);
    }
  };

  const isHealthcareProfessional = user?.role === 'healthcare_professional' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isHealthcareProfessional,
        loginAsDemoUser,
      }}
    >
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
