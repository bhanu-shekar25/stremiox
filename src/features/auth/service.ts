import { APIStore } from '@/core/api/stremio';
import { setRDToken, rdAxios } from '@/core/api/axios';
import type { StremioUser } from '@/types';

export async function loginStremio(
  email: string,
  password: string
): Promise<StremioUser> {
  try {
    // Login to Stremio API
    const user = await APIStore.login({ email, password });
    
    // Pull add-on collection after successful login
    await APIStore.pullAddonCollection();
    
    return user;
  } catch (error) {
    console.error('Stremio login failed:', error);
    throw new Error('Login failed. Please check your credentials.');
  }
}

export async function clearSession(): Promise<void> {
  // Clear RD token from axios
  delete rdAxios.defaults.headers.common['Authorization'];
  
  // Zustand persist will handle clearing SecureStore when logout is called
} 
