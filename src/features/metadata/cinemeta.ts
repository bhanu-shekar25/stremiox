import { cinemetaAxios } from '@/core/api/axios';
import type { LibraryItem, CatalogDefinition } from '@/types';

interface CinemetaMetaResponse {
  meta: {
    id: string;
    type: 'movie' | 'series';
    name: string;
    poster: string;
    background?: string;
    year?: number;
    imdbRating?: number;
    genres?: string[];
    description?: string;
    runtime?: string;
    cast?: string[];
    director?: string[];
    videos?: Array<{
      id: string;
      season: number;
      episode: number;
      title: string;
      overview?: string;
      thumbnail?: string;
      released?: string;
    }>;
  };
}

interface CinemetaCatalogResponse {
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
 * Fetch metadata for a single movie or series
 */
export async function getMeta(
  type: 'movie' | 'series',
  id: string
): Promise<LibraryItem> {
  try {
    const response = await cinemetaAxios.get<CinemetaMetaResponse>(
      `/meta/${type}/${id}.json`
    );

    const meta = response.data.meta;

    return {
      id: meta.id,
      type: meta.type,
      name: meta.name,
      poster: meta.poster,
      background: meta.background,
      year: meta.year,
      imdbRating: meta.imdbRating,
      genres: meta.genres,
      description: meta.description,
      runtime: meta.runtime,
      cast: meta.cast,
      director: meta.director,
    };
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
    throw new Error('Failed to fetch metadata');
  }
}

/**
 * Fetch a single catalog page from an add-on
 */
export async function getCatalog(
  transportUrl: string,
  type: string,
  catalogId: string,
  extra?: Record<string, string>
): Promise<LibraryItem[]> {
  try {
    // Remove /manifest.json from transportUrl if present
    const baseUrl = transportUrl.replace(/\/manifest\.json$/, '');
    
    // Build URL with extra params as path segments
    let url = `/catalog/${type}/${catalogId}`;

    if (extra && Object.keys(extra).length > 0) {
      const extraPath = Object.entries(extra)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `/${extraPath}`;
    }

    url += '.json';

    console.log('[getCatalog] Fetching:', baseUrl + url);

    const response = await cinemetaAxios.get<CinemetaCatalogResponse>(url, {
      baseURL: baseUrl,
      timeout: 10000,
    });

    console.log('[getCatalog] Response:', response.data.metas?.length || 0, 'items');

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
    console.error('Failed to fetch catalog:', transportUrl, error);
    return [];
  }
}

/**
 * Search across Cinemeta catalog
 */
export async function searchCinemeta(query: string): Promise<LibraryItem[]> {
  try {
    // Cinemeta doesn't have a direct search endpoint, but we can use the catalog
    // with search extra parameter for add-ons that support it
    const response = await getCatalog(
      'https://v3-cinemeta.strem.io',
      'movie',
      'top',
      { search: query }
    );

    return response;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

/**
 * Fetch episodes for a series (from meta response)
 */
export async function getSeriesEpisodes(
  id: string
): Promise<
  Array<{
    id: string;
    season: number;
    episode: number;
    title: string;
    overview?: string;
    thumbnail?: string;
    released?: string;
  }>
> {
  try {
    const meta = await getMeta('series', id);
    // Note: Cinemeta doesn't return episodes in the meta response
    // This would need to be implemented with a different API or add-on
    return [];
  } catch (error) {
    console.error('Failed to fetch episodes:', error);
    return [];
  }
} 
