import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from './store';

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);
  
  return { isAuthenticated };
} 
