import { StremioAPIStore } from 'stremio-api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Synchronous in-memory cache — stremio-api-client requires SYNCHRONOUS getJSON/setJSON
const memoryCache: Record<string, any> = {};

// 2. Storage adapter — MUST be synchronous (stremio-api-client calls getJSON() without await)
const storage = {
  getJSON: (key: string) => {
    const value = memoryCache[key];
    if (value === undefined) {
      // Safe defaults so the library doesn't crash on first run
      if (key === 'addons') return [];
      return null;
    }
    return value;
  },
  setJSON: (key: string, val: any) => {
    // Update in-memory cache immediately (synchronous)
    memoryCache[key] = val;
    // Persist to AsyncStorage in background
    if (val === null) {
      AsyncStorage.removeItem(key).catch(console.error);
    } else {
      AsyncStorage.setItem(key, JSON.stringify(val)).catch(console.error);
    }
  },
};

// 3. Create APIStore singleton
export const APIStore = new StremioAPIStore({ storage });

/**
 * Called once at app startup (in _layout.tsx) BEFORE any API calls.
 * Loads persisted data from AsyncStorage into the in-memory cache,
 * then restores the APIStore state.
 */
export const hydrateStremioCache = async () => {
  try {
    const KEYS = ['authKey', 'user', 'addons', 'addonsLastModified'];

    for (const key of KEYS) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw !== null) {
          let parsed = JSON.parse(raw);

          // Safety: addons must always be an array
          if (key === 'addons' && !Array.isArray(parsed)) {
            console.warn('[StremioAPI] Corrupted addons in storage, resetting');
            parsed = [];
            await AsyncStorage.removeItem(key);
          }

          memoryCache[key] = parsed;
        }
      } catch (e) {
        console.warn(`[StremioAPI] Failed to load key "${key}":`, e);
      }
    }

    // ✅ FIX: Manually restore user and re-trigger userChange so the internal
    // ApiClient gets the correct authKey. Without this, authenticated API
    // calls fail after app restart because the ApiClient has no authKey.
    const user = memoryCache['user'];
    const authKey = memoryCache['authKey'];

    if (user && authKey) {
      // userChange recreates the internal ApiClient with the correct authKey
      (APIStore as any).userChange(authKey, user);
      console.log('[StremioAPI] Restored session for:', user.email);
    }

    // Restore addons
    if (Array.isArray(memoryCache['addons']) && memoryCache['addons'].length > 0) {
      APIStore.addons.load(memoryCache['addons']);
      console.log('[StremioAPI] Restored', memoryCache['addons'].length, 'addons');
    }
  } catch (e) {
    console.error('[StremioAPI] Hydration failed:', e);
  }
};
