import { useState, useEffect } from 'react';
import { apiClient, User, isAuthenticated } from '../lib/api';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (isAuthenticated()) {
        try {
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Failed to get current user:', error);
          apiClient.clearToken();
          setIsLoggedIn(false);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (initData: string) => {
    try {
      setIsLoading(true);
      const authResponse = await apiClient.authenticateWithTelegram(initData);
      setUser(authResponse.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    setIsLoggedIn(false);
  };

  return {
    user,
    isLoading,
    isLoggedIn,
    login,
    logout,
  };
};