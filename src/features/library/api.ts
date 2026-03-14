import { stremioAxios } from '@/core/api/axios';
import type { LibraryItem } from '@/types';

interface StremioLibraryResponse {
  result: Array<{
    _id: string;
    type: 'movie' | 'series';
    name: string;
    poster: string;
    year?: number;
    imdbRating?: number;
    genres?: string[];
    removed?: boolean;
  }>;
}

/**
 * Fetch user's Stremio library
 * Requires authKey from logged-in user
 */
export async function fetchLibrary(authKey: string): Promise<LibraryItem[]> {
  try {
    const response = await stremioAxios.post<StremioLibraryResponse>(
      '/api/datastoreGet',
      {
        authKey,
        collection: 'libraryItem',
        ids: [],
        lastModified: null,
      }
    );

    // Filter out removed items
    return response.data.result
      .filter((item) => !item.removed)
      .map((item) => ({
        id: item._id,
        type: item.type,
        name: item.name,
        poster: item.poster,
        year: item.year,
        imdbRating: item.imdbRating,
        genres: item.genres,
      }));
  } catch (error) {
    console.error('Failed to fetch library:', error);
    return [];
  }
}

/**
 * Add item to Stremio library
 */
export async function addToLibrary(
  authKey: string,
  itemId: string,
  type: 'movie' | 'series',
  name: string,
  poster: string
): Promise<void> {
  try {
    await stremioAxios.post('/api/datastoreSet', {
      authKey,
      collection: 'libraryItem',
      id: itemId,
      type,
      name,
      poster,
    });
  } catch (error) {
    console.error('Failed to add to library:', error);
    throw error;
  }
}

/**
 * Remove item from Stremio library
 */
export async function removeFromLibrary(
  authKey: string,
  itemId: string
): Promise<void> {
  try {
    await stremioAxios.post('/api/datastoreSet', {
      authKey,
      collection: 'libraryItem',
      id: itemId,
      removed: true,
    });
  } catch (error) {
    console.error('Failed to remove from library:', error);
    throw error;
  }
} 
