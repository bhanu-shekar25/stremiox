import { create } from 'zustand';
import type { LibraryItem, WatchProgress } from '@/types';
import type { HomeRow } from './api';
import { fetchContinueWatching, fetchHomeRows, fetchHeroItem } from './api';
import { useAddonStore } from '@/features/addons/store';

interface HomeState {
  heroItem: LibraryItem | null;
  continueWatching: WatchProgress[];
  rows: HomeRow[];
  downloadedItems: LibraryItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setHeroItem: (item: LibraryItem | null) => void;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  heroItem: null,
  continueWatching: [],
  rows: [],
  downloadedItems: [],
  isLoading: true,
  isRefreshing: false,
  error: null,

  refresh: async () => {
    const isRefreshing = get().isRefreshing;
    
    // Prevent concurrent refreshes
    if (isRefreshing) return;

    set({ isRefreshing: true, error: null });

    try {
      // Get addons from store
      const addons = useAddonStore.getState().addons;
      
      // If no addons, just load continue watching
      if (addons.length === 0) {
        const continueWatching = await fetchContinueWatching();
        set({
          continueWatching,
          isLoading: false,
          isRefreshing: false,
        });
        return;
      }

      // Fetch all home data in parallel
      const [continueWatching, rows, heroItem] = await Promise.all([
        fetchContinueWatching(),
        fetchHomeRows(addons),
        fetchHeroItem(addons),
      ]);

      set({
        continueWatching,
        rows,
        heroItem: heroItem || get().heroItem,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error) {
      console.error('Failed to refresh home:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load content',
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  setHeroItem: (item) => {
    set({ heroItem: item });
  },
})); 
