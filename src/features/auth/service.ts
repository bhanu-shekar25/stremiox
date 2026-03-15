import { APIStore } from '@/core/api/stremio';
import { setRDToken, rdAxios } from '@/core/api/axios';
import type { StremioUser } from '@/types';

export async function loginStremio(
  email: string,
  password: string
): Promise<StremioUser> {
  try {
    console.log('[Auth] Logging in to Stremio API...');
    
    // Login to Stremio API
    const user = await APIStore.login({ email, password });
    console.log('[Auth] Login successful:', user.email);

    // Pull user data from API to get latest profile
    console.log('[Auth] Pulling user data from Stremio API...');
    await APIStore.pullUser();
    console.log('[Auth] User data synced:', APIStore.user?.email);

    // Pull add-on collection after successful login
    console.log('[Auth] Pulling addon collection from Stremio API...');
    await APIStore.pullAddonCollection();
    console.log('[Auth] Addons synced:', APIStore.addons?.addons?.length ?? 0, 'addons');

    // Return the synced user data
    return APIStore.user!;
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
