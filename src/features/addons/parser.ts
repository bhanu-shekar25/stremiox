import type { AddonManifest, CatalogDefinition } from '@/types';

/**
 * Check if addon has a resource (handles both string and object resource types)
 */
function hasResource(addon: AddonManifest, resource: string): boolean {
  if (!addon.resources || !Array.isArray(addon.resources)) {
    return false;
  }
  
  return addon.resources.some((r) => {
    // Resource is a string (e.g., 'stream', 'catalog')
    if (typeof r === 'string') {
      return r === resource;
    }
    // Resource is an object (e.g., { name: 'stream', types: ['movie', 'series'] })
    if (typeof r === 'object' && r !== null) {
      return r.name === resource;
    }
    return false;
  });
}

/**
 * Filter installed add-ons by resource type
 */
export function getAddonsByResource(
  addons: AddonManifest[],
  resource: 'stream' | 'catalog' | 'subtitles'
): AddonManifest[] {
  return addons.filter((addon) => {
    // Check if addon has resources array and it includes the requested resource
    if (!addon.resources || !Array.isArray(addon.resources)) {
      return false;
    }
    return hasResource(addon, resource);
  });
}

/**
 * Filter addons by type (movie/series)
 */
export function getAddonsByType(
  addons: AddonManifest[],
  type: 'movie' | 'series'
): AddonManifest[] {
  return addons.filter((addon) => {
    if (!addon.types || !Array.isArray(addon.types)) {
      return false;
    }
    return addon.types.includes(type);
  });
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
  // Remove /manifest.json and trailing slash from transportUrl
  let baseUrl = addon.transportUrl
    .replace(/\/manifest\.json$/, '')
    .replace(/\/$/, '');

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
  if (!addon.catalogs || !Array.isArray(addon.catalogs)) {
    return false;
  }
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
    if (!addon.catalogs || !Array.isArray(addon.catalogs)) {
      return;
    }
    addon.catalogs.forEach((catalog) => {
      if (catalog.type === type) {
        result.push({ addon, catalog });
      }
    });
  });

  return result;
} 
