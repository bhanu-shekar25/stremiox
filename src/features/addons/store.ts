import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIStore } from '@/core/api/stremio';
import type { AddonManifest } from '@/types';
import { getAddonsByResource } from './parser';

// Fallback addons if user is not logged in or has no addons
const FALLBACK_ADDONS: AddonManifest[] = [
  {
    id: 'com.stremio.cinemeta',
    version: '1.0.0',
    name: 'Cinemeta',
    description: 'Cinemeta - The movie & TV metadata database',
    logo: 'https://cinemeta-live.strem.io/logo.png',
    types: ['movie', 'series'],
    catalogs: [
      {
        id: 'top',
        type: 'movie',
        name: 'Top Movies',
        extra: [],
      },
      {
        id: 'top',
        type: 'series',
        name: 'Top Series',
        extra: [],
      },
      {
        id: 'new',
        type: 'movie',
        name: 'New Movies',
        extra: [],
      },
      {
        id: 'new',
        type: 'series',
        name: 'New Series',
        extra: [],
      },
      {
        id: 'latest',
        type: 'series',
        name: 'Latest Series',
        extra: [],
      },
    ],
    resources: ['catalog', 'meta', 'stream'],
    transportUrl: 'https://v3-cinemeta.strem.io',
    behaviorHints: {
      configurable: false,
      configurationRequired: false,
      p2p: false,
      adult: false,
    },
  },
  {
    id: 'com.stremio.openload',
    version: '1.0.0',
    name: 'OpenLoad',
    description: 'OpenLoad - Video hosting addon',
    logo: 'https://openload-v2.strem.io/logo.png',
    types: ['movie', 'series'],
    catalogs: [],
    resources: ['stream'],
    transportUrl: 'https://openload-v2.strem.io',
    behaviorHints: {
      configurable: false,
      configurationRequired: false,
      p2p: false,
      adult: false,
    },
  },
  {
    id: 'com.stremio.torrentio',
    version: '1.0.0',
    name: 'Torrentio',
    description: 'Torrentio - Torrent streams for movies and series',
    logo: 'https://torrentio.strem.fun/logo.png',
    types: ['movie', 'series'],
    catalogs: [],
    resources: ['stream'],
    transportUrl: 'https://torrentio.strem.fun',
    behaviorHints: {
      configurable: true,
      configurationRequired: false,
      p2p: true,
      adult: false,
    },
  },
];

interface AddonState {
  addons: AddonManifest[];
  lastSynced: number | null;
  isLoading: boolean;
  sync: () => Promise<void>;
  getByResource: (resource: string) => AddonManifest[];
  getByType: (type: string) => AddonManifest[];
  hasAddons: () => boolean;
}

export const useAddonStore = create<AddonState>()(
  persist(
    (set, get) => ({
      addons: FALLBACK_ADDONS,
      lastSynced: null,
      isLoading: false,

      sync: async () => {
        set({ isLoading: true });
        try {
          console.log('[AddonStore] Pulling addon collection from Stremio API...');

          // First ensure we have user data synced
          if (APIStore.user) {
            console.log('[AddonStore] User found, pulling latest data...');
            await APIStore.pullUser();
          }

          await APIStore.pullAddonCollection();
          let apiAddons = APIStore.addons?.addons || [];
          console.log('[AddonStore] Synced', apiAddons.length, 'addons from API');
          
          // Check if addons are wrapped in { manifest, transportUrl } structure
          if (apiAddons.length > 0 && apiAddons[0]?.manifest) {
            console.log('[AddonStore] Unwrapping addons from manifest structure');
            apiAddons = apiAddons.map((a: any) => ({
              ...a.manifest,
              transportUrl: a.transportUrl || a.manifest.transportUrl,
            }));
          }
          
          console.log('[AddonStore] Sample API addon:', JSON.stringify(apiAddons[0], null, 2).slice(0, 500));

          // Check if API addons have proper structure
          const validAddons = apiAddons.filter((a: AddonManifest) => {
            const hasCatalogs = a.catalogs && Array.isArray(a.catalogs) && a.catalogs.length > 0;
            const hasResources = a.resources && Array.isArray(a.resources) && a.resources.length > 0;
            return hasCatalogs || hasResources;
          });

          console.log('[AddonStore] Valid addons:', validAddons.length);

          // Use API addons if available and valid, otherwise use fallback
          const addonsToUse = validAddons.length > 0 ? validAddons : FALLBACK_ADDONS;

          set({
            addons: addonsToUse,
            lastSynced: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to sync add-ons:', error);
          // Fall back to default addons on error
          set({
            addons: FALLBACK_ADDONS,
            isLoading: false,
          });
        }
      },

      getByResource: (resource: string) => {
        return getAddonsByResource(get().addons, resource as any);
      },

      getByType: (type: string) => {
        return get().addons.filter((addon) => addon.types.includes(type));
      },

      hasAddons: () => {
        return get().addons.length > 0;
      },
    }),
    {
      name: 'stremiox-addons',
      storage: createJSONStorage(() => AsyncStorage),
      // Skip hydration - always start with defaults and let sync update
      skipHydration: true,
    }
  )
);

// Manually hydrate on app start
export const hydrateAddonStore = async () => {
  try {
    // First, try to hydrate from the Stremio API Store (which has the correct format)
    if (APIStore.addons?.addons && Array.isArray(APIStore.addons.addons) && APIStore.addons.addons.length > 0) {
      let apiAddons = APIStore.addons.addons;
      
      // Check if addons are wrapped in { manifest, transportUrl } structure
      if (apiAddons[0]?.manifest) {
        console.log('[AddonStore] Unwrapping', apiAddons.length, 'addons from manifest structure');
        apiAddons = apiAddons.map((a: any) => ({
          ...a.manifest,
          transportUrl: a.transportUrl || a.manifest.transportUrl,
        }));
      }
      
      console.log('[AddonStore] Got', apiAddons.length, 'addons from APIStore');
      console.log('[AddonStore] Sample APIStore addon:', JSON.stringify(apiAddons[0], null, 2).slice(0, 500));
      
      // Validate addons structure
      const validAddons = apiAddons.filter((a: AddonManifest) => {
        const hasCatalogs = a.catalogs && Array.isArray(a.catalogs) && a.catalogs.length > 0;
        const hasResources = a.resources && Array.isArray(a.resources) && a.resources.length > 0;
        return hasCatalogs || hasResources;
      });
      
      if (validAddons.length > 0) {
        useAddonStore.setState({
          addons: validAddons,
          lastSynced: Date.now(),
        });
        console.log('[AddonStore] Initialized with', validAddons.length, 'valid addons from APIStore');
        return;
      }
    }
    
    // Fallback: Check AsyncStorage for 'addons' key (stremio-api-client storage)
    const storedAddons = await AsyncStorage.getItem('addons');
    if (storedAddons) {
      const apiAddons = JSON.parse(storedAddons);
      console.log('[AddonStore] Raw stored addons:', Array.isArray(apiAddons) ? apiAddons.length : 'not an array');
      if (Array.isArray(apiAddons) && apiAddons.length > 0) {
        console.log('[AddonStore] Sample stored addon keys:', Object.keys(apiAddons[0]));
        
        // Check if addons are wrapped in { manifest, transportUrl } structure
        let addonsToUse = apiAddons;
        if (apiAddons[0]?.manifest) {
          console.log('[AddonStore] Unwrapping addons from manifest structure');
          addonsToUse = apiAddons.map((a: any) => ({
            ...a.manifest,
            transportUrl: a.transportUrl || a.manifest.transportUrl,
          }));
        }
        
        console.log('[AddonStore] Sample stored addon:', JSON.stringify(addonsToUse[0], null, 2).slice(0, 500));
        
        // Validate addons structure
        const validAddons = addonsToUse.filter((a: AddonManifest) => {
          const hasCatalogs = a.catalogs && Array.isArray(a.catalogs) && a.catalogs.length > 0;
          const hasResources = a.resources && Array.isArray(a.resources) && a.resources.length > 0;
          return hasCatalogs || hasResources;
        });
        
        if (validAddons.length > 0) {
          // Load into APIStore first
          APIStore.addons.load(validAddons);
          useAddonStore.setState({
            addons: validAddons,
            lastSynced: Date.now(),
          });
          console.log('[AddonStore] Loaded', validAddons.length, 'valid addons from AsyncStorage');
          return;
        }
      }
    }
    
    // Fallback: Check zustand storage
    const stored = await AsyncStorage.getItem('stremiox-addons');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.addons && Array.isArray(parsed.state.addons)) {
        useAddonStore.setState({
          addons: parsed.state.addons,
          lastSynced: parsed.state.lastSynced || null,
        });
        console.log('[AddonStore] Hydrated with', useAddonStore.getState().addons.length, 'addons from zustand storage');
        return;
      }
    }
    
    // Last resort: Use fallback addons
    useAddonStore.setState({ addons: FALLBACK_ADDONS });
    console.log('[AddonStore] Initialized with fallback addons');
    
    // Also hydrate user data from Stremio API store
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      APIStore.user = user;
      console.log('[AddonStore] Hydrated user:', user?.email);
    }
  } catch (error) {
    console.error('Failed to hydrate addon store:', error);
    // Fall back to defaults
    useAddonStore.setState({ addons: FALLBACK_ADDONS });
  }
};
