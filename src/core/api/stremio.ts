import { StremioAPIStore } from 'stremio-api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Create a synchronous in-memory cache
const memoryCache: Record<string, any> = {};

// 2. Create the storage adapter that stremio-api-client expects (100% synchronous)
const storage = {
  getJSON: (key: string) => {
    // Return from memory immediately (no await, no promises!)
    const value = memoryCache[key];
    if (value === undefined) {
      return key.includes('addons') ? [] : null;
    }
    return value;
  },
  setJSON: (key: string, val: any) => {
    // Save to memory for instant access
    memoryCache[key] = val;
    // Save to device hard drive in the background
    AsyncStorage.setItem(key, JSON.stringify(val)).catch(console.error);
  },
};

// 3. Initialize the store safely
export const APIStore = new StremioAPIStore({ storage });

// 4. Export a function to preload the cache when the app starts
export const hydrateStremioCache = async () => {
  try {
    const keys = ['user', 'addons', 'authKey'];
    for (const key of keys) {
      const val = await AsyncStorage.getItem(key);
      if (val) {
        let parsed = JSON.parse(val);

        // THE MAGIC FAILSAFE: If it's addons, force it to be an array!
        if (key.includes('addons') && !Array.isArray(parsed)) {
          console.warn("Corrupted addons cache found during hydration. Wiping it.");
          parsed = [];
        }

        memoryCache[key] = parsed;
      }
    }

    // Restore user data to APIStore
    if (memoryCache['user']) {
      APIStore.user = memoryCache['user'];
      console.log('[StremioAPI] Hydrated user:', memoryCache['user']?.email);
    }
    
    // Restore addons to APIStore
    if (memoryCache['addons']) {
      APIStore.addons.load(memoryCache['addons']);
      console.log('[StremioAPI] Hydrated', memoryCache['addons']?.length ?? 0, 'addons');
    }
  } catch (e) {
    console.error("Failed to hydrate Stremio cache", e);
  }
};
