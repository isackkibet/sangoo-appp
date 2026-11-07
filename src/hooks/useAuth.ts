/**
 * Custom React Hook for Authentication
 * Provides authentication state and utilities
 */

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth/authService';

interface UseAuthReturn {
  isAuthenticated: boolean;
  email: string | null;
  login: (email: string, password: string) => boolean;
  signInWithGoogle: () => void;
  logout: () => void;
  addToWaitlist: (email: string) => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = authService.isAdminAuthenticated();
      const userEmail = authService.getAdminEmail();
      const [isPending, startTransition] = useTransition();
      if (!isPending) {
        startTransition(() => {
          setIsAuthenticated(isAuth);
          setEmail(userEmail);
        });
      }
    }
  }, []);

  const login = (userEmail: string, password: string): boolean => {
    if (authService.verifyAdminPassword(password)) {
      authService.setAdminAuth(userEmail);
      setIsAuthenticated(true);
      setEmail(userEmail);
      return true;
    }
    return false;
  };

  const signInWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const logout = () => {
    authService.logoutAdmin();
    setIsAuthenticated(false);
    setEmail(null);
    router.push('/admin');
  };

  const addToWaitlist = async (userEmail: string): Promise<boolean> => {
    return await authService.addToWaitlist(userEmail);
  };

  return {
    isAuthenticated,
    email,
    login,
    signInWithGoogle,
    logout,
    addToWaitlist,
  };
}
