import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API_ENDPOINTS from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'inspector' | 'workman';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔐 AuthProvider rendering - user:', user, 'isLoading:', isLoading);

  useEffect(() => {
    console.log('🔐 AuthProvider useEffect running');
    // Check for existing session
    const token = sessionStorage.getItem('authToken');
    console.log('🔐 Found token in sessionStorage:', !!token);
    
    if (token) {
      // Validate token with backend
      console.log('🔐 Validating existing token...');
      validateToken(token);
    } else {
      console.log('🔐 No token found, setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    console.log('🔐 Starting token validation...');
    try {
      const response = await fetch(API_ENDPOINTS.AUTH_ME, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔐 Token validation response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Token validation response data:', data);
        
        if (data.success) {
          console.log('🔐 Token valid, setting user:', data.user);
          setUser(data.user);
        } else {
          console.log('🔐 Token validation failed, removing token');
          sessionStorage.removeItem('authToken');
        }
      } else {
        console.log('🔐 Token validation failed with status:', response.status);
        sessionStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('🔐 Token validation error:', error);
      sessionStorage.removeItem('authToken');
    } finally {
      console.log('🔐 Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt for:', email);
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔐 Login response:', data);
      
      if (data.success) {
        console.log('🔐 Login successful, setting token and user');
        sessionStorage.setItem('authToken', data.token);
        setUser(data.user);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🔐 Logging out user');
    sessionStorage.removeItem('authToken');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  console.log('🔐 AuthProvider value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 