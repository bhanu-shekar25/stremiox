import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIStore } from '@/core/api/stremio';
import type { AddonManifest } from '@/types';
import { getAddonsByResource } from './parser';

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
      addons: [],
      lastSynced: null,
      isLoading: false,

      sync: async () => {
        set({ isLoading: true });
        try {
          await APIStore.pullAddonCollection();
          const addons = APIStore.addons?.addons || [];
          set({
            addons,
            lastSynced: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to sync add-ons:', error);
          set({ isLoading: false });
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
    }
  )
); 
