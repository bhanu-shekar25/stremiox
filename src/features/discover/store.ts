import { create } from 'zustand';
import type { LibraryItem, CatalogDefinition } from '@/types';
import { fetchCatalog } from './api';

interface CatalogSource {
  name: string;
  addonUrl: string;
  catalogId: string;
  type: 'movie' | 'series';
}

interface DiscoverState {
  items: LibraryItem[];
  type: 'movie' | 'series';
  genre: string | null;
  sort: string;
  activeCatalog: CatalogSource | null;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
  setType: (type: 'movie' | 'series') => void;
  setGenre: (genre: string | null) => void;
  setSort: (sort: string) => void;
  setCatalog: (catalog: CatalogSource | null) => void;
  loadPage: () => Promise<void>;
  reset: () => void;
}

const PAGE_SIZE = 30;

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  items: [],
  type: 'movie',
  genre: null,
  sort: 'Latest',
  activeCatalog: null,
  isLoading: true,
  isFetchingMore: false,
  hasMore: true,
  page: 0,
  error: null,

  setType: (type) => {
    set({ type });
    get().reset();
    get().loadPage();
  },

  setGenre: (genre) => {
    set({ genre });
    get().reset();
    get().loadPage();
  },

  setSort: (sort) => {
    set({ sort });
    get().reset();
    get().loadPage();
  },

  setCatalog: (catalog) => {
    set({ activeCatalog: catalog });
    get().reset();
    get().loadPage();
  },

  loadPage: async () => {
    const { activeCatalog, type, genre, sort, page, items, isFetchingMore } = get();
    
    if (!activeCatalog || isFetchingMore) return;

    if (page === 0) {
      set({ isLoading: true, error: null });
    } else {
      set({ isFetchingMore: true });
    }

    try {
      const newItems = await fetchCatalog({
        addonUrl: activeCatalog.addonUrl,
        type,
        catalogId: activeCatalog.catalogId,
        genre: genre || undefined,
        sort,
        skip: page * PAGE_SIZE,
      });

      set({
        items: page === 0 ? newItems : [...items, ...newItems],
        page: page + 1,
        hasMore: newItems.length === PAGE_SIZE,
        isLoading: false,
        isFetchingMore: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load discover catalog:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load content',
        isLoading: false,
        isFetchingMore: false,
        hasMore: false,
      });
    }
  },

  reset: () => {
    set({
      items: [],
      page: 0,
      hasMore: true,
      error: null,
    });
  },
})); 
