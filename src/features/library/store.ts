import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LibraryItem } from '@/types';
import { fetchLibrary } from './api';

type TypeFilter = 'all' | 'movie' | 'series';
type SortOption = 'watched' | 'name' | 'year' | 'rating';

interface LibraryState {
  items: LibraryItem[];
  typeFilter: TypeFilter;
  sortBy: SortOption;
  lastSynced: number | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  filteredItems: () => LibraryItem[];
  sync: (authKey: string) => Promise<void>;
  setTypeFilter: (filter: TypeFilter) => void;
  setSortBy: (sort: SortOption) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      items: [],
      typeFilter: 'all',
      sortBy: 'watched',
      lastSynced: null,
      isLoading: true,
      isSyncing: false,
      error: null,

      filteredItems: () => {
        const { items, typeFilter, sortBy } = get();
        
        let filtered = [...items];
        
        // Apply type filter
        if (typeFilter !== 'all') {
          filtered = filtered.filter((item) => item.type === typeFilter);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'year':
              return (b.year || 0) - (a.year || 0);
            case 'rating':
              return (b.imdbRating || 0) - (a.imdbRating || 0);
            case 'watched':
            default:
              // For now, just return as-is (would need watch progress integration)
              return 0;
          }
        });
        
        return filtered;
      },

      sync: async (authKey: string) => {
        set({ isSyncing: true, error: null });
        
        try {
          const items = await fetchLibrary(authKey);
          set({
            items,
            lastSynced: Date.now(),
            isLoading: false,
            isSyncing: false,
          });
        } catch (error) {
          console.error('Failed to sync library:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to sync library',
            isLoading: false,
            isSyncing: false,
          });
        }
      },

      setTypeFilter: (filter) => {
        set({ typeFilter: filter });
      },

      setSortBy: (sort) => {
        set({ sortBy: sort });
      },
    }),
    {
      name: 'stremiox-library',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 
