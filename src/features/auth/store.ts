import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { loginStremio, clearSession } from './service';
import { setRDToken } from '@/core/api/axios';
import type { StremioUser } from '@/types';

// Custom SecureStore adapter for Zustand persist
const secureStorage = {
  getItem: async (key: string) => await SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => await SecureStore.deleteItemAsync(key),
};

interface AuthState {
  stremioUser: StremioUser | null;
  rdApiKey: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rdKey: string) => Promise<void>;
  logout: () => Promise<void>;
  setRDKey: (key: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      stremioUser: null,
      rdApiKey: null,
      isAuthenticated: false,
      
      login: async (email, password, rdKey) => {
        // Login to Stremio
        const user = await loginStremio(email, password);
        
        // Set RD token in axios and store
        setRDToken(rdKey);
        
        // Update state
        set({ 
          stremioUser: user, 
          rdApiKey: rdKey,
          isAuthenticated: true 
        });
      },
      
      logout: async () => {
        await clearSession();
        set({ 
          stremioUser: null, 
          rdApiKey: null,
          isAuthenticated: false 
        });
      },
      
      setRDKey: (key) => {
        setRDToken(key);
        set({ rdApiKey: key });
      },
    }),
    {
      name: 'stremiox-auth',
      storage: createJSONStorage(() => secureStorage),
    }
  )
); 
