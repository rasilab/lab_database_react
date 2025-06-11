import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  authenticateWithToken: (token: string) => Promise<boolean>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // GitHub OAuth App configuration
  const CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID || 'your_github_client_id';
  const REDIRECT_URI = process.env.REACT_APP_GITHUB_REDIRECT_URI || window.location.origin;

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Try automatic authentication
        const authResult = await authService.tryAutoAuth();
        
        if (authResult.success && authResult.user) {
          setUser(authResult.user);
        }
      } catch (error) {
        console.error('Authentication initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const exchangeCodeForToken = async (code: string, state: string) => {
    try {
      setIsLoading(true);
      
      // Since we can't use client secret in frontend, we'll redirect users to 
      // manually create a personal access token for now
      // In production, you'd need a backend service to handle this
      
      alert('OAuth setup required: Please create a personal access token at https://github.com/settings/tokens with repo and user permissions, then contact the admin to configure OAuth properly.');
      
      setIsLoading(false);
    } catch (error) {
      console.error('OAuth error:', error);
      setIsLoading(false);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      
      // Check if user has access to the required organization
      const orgResponse = await fetch(`https://api.github.com/user/memberships/orgs/rasilab`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const isActiveMember = orgResponse.ok;
      
      const authUser: AuthUser = {
        username: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        isAdmin: userData.login === 'rasilab' || userData.site_admin,
        isActiveMember: isActiveMember,
      };

      setUser(authUser);
      
      // Store token and user data
      localStorage.setItem('github_token', token);
      localStorage.setItem('github_user', JSON.stringify(authUser));
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        // Token is invalid, clear it
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = () => {
    // Login is now handled by TokenLogin component
    // This method exists for interface compatibility
  };

  const logout = () => {
    setUser(null);
    authService.clearAuth();
  };

  const authenticateWithToken = async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const userData = await authService.getUserData(token);
      if (userData) {
        authService.storeAuth(token, userData);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token authentication failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    authenticateWithToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};