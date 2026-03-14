import { cinemetaAxios } from '@/core/api/axios';
import { useAddonStore } from '@/features/addons/store';
import { hasSearchSupport } from '@/features/addons/parser';
import type { LibraryItem } from '@/types';

interface CinemetaSearchResponse {
  metas: Array<{
    id: string;
    type: 'movie' | 'series';
    name: string;
    poster: string;
    year?: number;
    imdbRating?: number;
    genres?: string[];
  }>;
}

/**
 * Search Cinemeta catalog
 */
export async function searchCinemeta(query: string): Promise<LibraryItem[]> {
  try {
    const response = await cinemetaAxios.get<CinemetaSearchResponse>(
      `/catalog/movie/top/search=${encodeURIComponent(query)}.json`
    );

    return response.data.metas.map((meta) => ({
      id: meta.id,
      type: meta.type,
      name: meta.name,
      poster: meta.poster,
      year: meta.year,
      imdbRating: meta.imdbRating,
      genres: meta.genres,
    }));
  } catch (error) {
    console.error('Cinemeta search failed:', error);
    return [];
  }
}

/**
 * Search across all installed add-ons that support search
 * Parallel fetch, flatten, deduplicate by id
 */
export async function searchAll(query: string): Promise<LibraryItem[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const addons = useAddonStore.getState().addons;
  
  // Get addons with search support
  const searchAddons = addons.filter((addon) => hasSearchSupport(addon));
  
  if (searchAddons.length === 0) {
    // Fallback to Cinemeta
    return searchCinemeta(query);
  }

  // Search all addons in parallel
  const searchPromises = searchAddons.map(async (addon) => {
    try {
      const catalog = addon.catalogs[0];
      if (!catalog) return [];

      const response = await cinemetaAxios.get<CinemetaSearchResponse>(
        `/catalog/${catalog.type}/${catalog.id}/search=${encodeURIComponent(query)}.json`,
        {
          baseURL: addon.transportUrl,
          timeout: 10000, // 10 second timeout per addon
        }
      );

      return response.data.metas.map((meta) => ({
        id: meta.id,
        type: meta.type,
        name: meta.name,
        poster: meta.poster,
        year: meta.year,
        imdbRating: meta.imdbRating,
        genres: meta.genres,
        addonId: addon.id,
        addonName: addon.name,
      }));
    } catch (error) {
      console.warn(`Search failed for ${addon.name}:`, error);
      return [];
    }
  });

  try {
    const results = await Promise.all(searchPromises);
    
    // Flatten results
    const allResults = results.flat();
    
    // Deduplicate by id
    const uniqueResults = Array.from(
      new Map(allResults.map((item) => [item.id, item])).values()
    );
    
    return uniqueResults;
  } catch (error) {
    console.error('Search all failed:', error);
    return [];
  }
} 
