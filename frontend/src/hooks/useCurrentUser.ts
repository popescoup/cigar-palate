import { useState, useEffect } from 'react';
import { CurrentUser, AuthState } from '@/types/auth';
import { api } from '@/utils/axiosConfig';

export const useCurrentUser = () => {
  const [authState, setAuthState] = useState<AuthState>({
    currentUser: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await api.get('/api/auth/status');
        
        if (data.isLoggedIn && data.user) {
          const user: CurrentUser = {
            ...data.user,
            id: data.user.userId || data.user.id,
            userId: data.user.userId || data.user.id,
            isAdmin: data.user.isAdmin ?? false
          };

          setAuthState({
            currentUser: user,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState({
            currentUser: null,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        setAuthState({
          currentUser: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        });
      }
    };

    fetchCurrentUser();
  }, []);

  const { currentUser, isLoading, error } = authState;

  return {
    currentUser,
    isLoading,
    error,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.isAdmin ?? false,
    userId: currentUser?.userId ?? null
  };
};