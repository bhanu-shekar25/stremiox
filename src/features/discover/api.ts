import { getCatalog } from '@/features/metadata/cinemeta';
import type { LibraryItem } from '@/types';

interface FetchCatalogParams {
  addonUrl: string;
  type: 'movie' | 'series';
  catalogId: string;
  genre?: string;
  sort?: string;
  skip?: number;
}

/**
 * Fetch catalog items with optional filters
 */
export async function fetchCatalog(params: FetchCatalogParams): Promise<LibraryItem[]> {
  const { addonUrl, type, catalogId, genre, sort } = params;
  
  // Build extra params for filtering
  const extra: Record<string, string> = {};
  
  if (genre) {
    extra.genre = genre;
  }
  
  if (sort) {
    extra.sort = sort;
  }
  
  // Skip is handled by pagination in the store
  // Extra params are passed as path segments
  
  return getCatalog(addonUrl, type, catalogId, extra);
}

/**
 * Fetch available genres for a content type from Cinemeta
 * Note: This is a mock implementation - in reality, genres would be fetched
 * from the add-on's catalog extra definitions
 */
export async function fetchGenres(type: 'movie' | 'series'): Promise<string[]> {
  // Common genres for movies and series
  const allGenres = [
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Family',
    'Fantasy',
    'History',
    'Horror',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Thriller',
    'War',
    'Western',
  ];
  
  return allGenres;
}

/**
 * Fetch available sort options
 */
export function getSortOptions(): string[] {
  return ['Latest', 'Popular', 'Top Rated', 'A-Z', 'Recent'];
} 
