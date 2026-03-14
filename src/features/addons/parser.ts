import type { AddonManifest, CatalogDefinition } from '@/types';

/**
 * Filter installed add-ons by resource type
 */
export function getAddonsByResource(
  addons: AddonManifest[],
  resource: 'stream' | 'catalog' | 'subtitles'
): AddonManifest[] {
  return addons.filter((addon) => addon.resources.includes(resource));
}

/**
 * Build stream URL for a movie or series episode
 */
export function buildStreamUrl(
  addon: AddonManifest,
  type: string,
  id: string,
  season?: number,
  episode?: number
): string {
  const baseUrl = addon.transportUrl.replace(/\/$/, ''); // Remove trailing slash

  if (type === 'movie') {
    return `${baseUrl}/stream/movie/${id}.json`;
  }

  if (type === 'series' && season !== undefined && episode !== undefined) {
    return `${baseUrl}/stream/series/${id}:${season}:${episode}.json`;
  }

  throw new Error('Invalid stream URL parameters');
}

/**
 * Build catalog URL for fetching catalog items
 */
export function buildCatalogUrl(
  addon: AddonManifest,
  type: string,
  catalogId: string,
  extra?: Record<string, string>
): string {
  const baseUrl = addon.transportUrl.replace(/\/$/, '');

  let extraPath = '';
  if (extra && Object.keys(extra).length > 0) {
    extraPath = Object.entries(extra)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  if (extraPath) {
    return `${baseUrl}/catalog/${type}/${catalogId}/${extraPath}.json`;
  }

  return `${baseUrl}/catalog/${type}/${catalogId}.json`;
}

/**
 * Check if an add-on supports search
 */
export function hasSearchSupport(addon: AddonManifest): boolean {
  return addon.catalogs.some((catalog) =>
    catalog.extra?.some((e) => e.name === 'search')
  );
}

/**
 * Get all catalogs from all add-ons that support a specific type
 */
export function getCatalogsByType(
  addons: AddonManifest[],
  type: string
): Array<{ addon: AddonManifest; catalog: CatalogDefinition }> {
  const result: Array<{ addon: AddonManifest; catalog: CatalogDefinition }> = [];

  addons.forEach((addon) => {
    addon.catalogs.forEach((catalog) => {
      if (catalog.type === type) {
        result.push({ addon, catalog });
      }
    });
  });

  return result;
} 
