import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '@/core/db';
import { downloads as downloadsTable } from '@/core/db/schema';
import type { Download, DownloadStatus, Stream, LibraryItem } from '@/types';
import * as engine from './engine';

// SQLite storage adapter for Zustand persist
const sqliteStorage = {
  getItem: async (_key: string): Promise<string | null> => {
    try {
      const rows = await db.select().from(downloadsTable).all();
      const downloadsObj = Object.fromEntries(rows.map((r) => [r.id, r]));
      return JSON.stringify({ state: { downloads: downloadsObj } });
    } catch (error) {
      console.error('Failed to hydrate downloads from SQLite:', error);
      return null;
    }
  },
  setItem: async (_key: string, _value: string): Promise<void> => {
    // SQLite writes happen in engine.ts directly - this is read-only for hydration
  },
  removeItem: async (_key: string): Promise<void> => {
    // No-op - SQLite is source of truth
  },
};

interface DownloadState {
  downloads: Record<string, Download>;
  activeCount: number;
  queue: string[];
  addDownload: (download: Download) => void;
  updateDownload: (id: string, update: Partial<Download>) => void;
  removeDownload: (id: string) => void;
  queueDownload: (params: {
    stream: Stream;
    meta: LibraryItem;
    season?: number;
    episode?: number;
  }) => Promise<string>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
  refreshDownloads: () => Promise<void>;
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},
      activeCount: 0,
      queue: [],

      addDownload: (download) => {
        set((state) => ({
          downloads: { ...state.downloads, [download.id]: download },
        }));
      },

      updateDownload: (id, update) => {
        set((state) => ({
          downloads: {
            ...state.downloads,
            [id]: { ...state.downloads[id], ...update },
          },
        }));
      },

      removeDownload: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.downloads;
          return { downloads: rest };
        });
      },

      queueDownload: async (params) => {
        const id = await engine.queueDownload(params);
        const download = await db
          .select()
          .from(downloadsTable)
          .where(eq(downloadsTable.id, id))
          .get();
        
        if (download) {
          get().addDownload(download as Download);
        }
        
        return id;
      },

      pauseDownload: async (id) => {
        await engine.pauseDownload(id);
        get().updateDownload(id, { status: 'paused' });
      },

      resumeDownload: async (id) => {
        await engine.resumeDownload(id);
        get().updateDownload(id, { status: 'downloading' });
      },

      cancelDownload: async (id) => {
        await engine.cancelDownload(id);
        get().removeDownload(id);
      },

      deleteDownload: async (id) => {
        await engine.deleteDownload(id);
        get().removeDownload(id);
      },

      refreshDownloads: async () => {
        const allDownloads = await engine.getAllDownloads();
        const downloadsObj = Object.fromEntries(
          allDownloads.map((d) => [d.id, { ...d, type: d.type as 'movie' | 'series' }])
        );
        set({ downloads: downloadsObj as Record<string, Download> });
      },
    }),
    {
      name: 'stremiox-downloads',
      storage: createJSONStorage(() => sqliteStorage),
      skipHydration: true, // Manually rehydrate after DB is initialized
    }
  )
);

// Import eq after to avoid circular dependency
import { eq } from 'drizzle-orm'; 
