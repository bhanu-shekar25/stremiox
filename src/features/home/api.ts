import { db } from '@/core/db';
import { watchProgress, downloads } from '@/core/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import type { WatchProgress, LibraryItem, AddonManifest } from '@/types';
import { getCatalog } from '@/features/metadata/cinemeta';
import { getAddonsByResource, buildCatalogUrl } from '@/features/addons/parser';

export interface HomeRow {
  title: string;
  items: LibraryItem[];
  addonId?: string;
}

/**
 * Fetch continue watching list from local database
 * Returns items with progress > 0 and < 95% complete
 */
export async function fetchContinueWatching(): Promise<WatchProgress[]> {
  try {
    const results = await db
      .select()
      .from(watchProgress)
      .where(
        sql`
          ${watchProgress.positionMs} > 0 
          AND CAST(${watchProgress.positionMs} AS REAL) / ${watchProgress.durationMs} < 0.95
        `
      )
      .orderBy(desc(watchProgress.updatedAt))
      .limit(15);

    return results.map((r) => ({
      id: r.id,
      imdbId: r.imdbId,
      type: r.type as 'movie' | 'series',
      title: r.title,
      season: r.season ?? undefined,
      episode: r.episode ?? undefined,
      posterUrl: r.posterUrl ?? undefined,
      positionMs: r.positionMs ?? 0,
      durationMs: r.durationMs ?? 0,
      isOffline: (r.isOffline ?? 0) === 1,
      updatedAt: r.updatedAt,
    }));
  } catch (error) {
    console.error('Failed to fetch continue watching:', error);
    return [];
  }
}

/**
 * Fetch home rows from add-on catalogs
 * Takes first 5 addons with catalogs and fetches their first catalog
 */
export async function fetchHomeRows(addons: AddonManifest[]): Promise<HomeRow[]> {
  const rows: HomeRow[] = [];

  console.log('[HomeAPI] Total addons:', addons.length);
  console.log('[HomeAPI] Sample addon:', addons[0]?.name, 'catalogs:', addons[0]?.catalogs?.length);

  // Get addons with catalog support
  const catalogAddons = getAddonsByResource(addons, 'catalog');
  console.log('[HomeAPI] Addons with catalog resource:', catalogAddons.length);
  console.log('[HomeAPI] Catalog addons:', catalogAddons.map(a => ({ name: a.name, catalogs: a.catalogs?.length })));

  const catalogAddonsToUse = catalogAddons.slice(0, 5);

  // Fetch catalog from each add-on (fail silently)
  for (const addon of catalogAddonsToUse) {
    try {
      // Skip addons without catalogs array or empty catalogs
      if (!addon.catalogs || !Array.isArray(addon.catalogs) || addon.catalogs.length === 0) {
        console.log('[HomeAPI] Skipping', addon.name, '- no catalogs');
        continue;
      }

      const firstCatalog = addon.catalogs[0];
      console.log('[HomeAPI] Fetching catalog:', firstCatalog.name, 'from', addon.name);
      
      const items = await getCatalog(
        addon.transportUrl,
        firstCatalog.type,
        firstCatalog.id
      );

      console.log('[HomeAPI] Got', items.length, 'items from', addon.name);

      if (items.length > 0) {
        rows.push({
          title: `${addon.name} - ${firstCatalog.name}`,
          items,
          addonId: addon.id,
        });
      }
    } catch (error) {
      // Fail silently per add-on - skip if one fails
      console.warn(`Failed to fetch catalog for ${addon.name}:`, error);
      continue;
    }
  }

  console.log('[HomeAPI] Total rows fetched:', rows.length);
  return rows;
}

/**
 * Fetch hero item (featured content)
 * For now, returns the first item from the first row
 */
export async function fetchHeroItem(
  addons: AddonManifest[]
): Promise<LibraryItem | null> {
  if (addons.length === 0) return null;
  
  try {
    const rows = await fetchHomeRows(addons);
    if (rows.length === 0 || rows[0].items.length === 0) return null;
    
    return rows[0].items[0];
  } catch (error) {
    console.error('Failed to fetch hero item:', error);
    return null;
  }
}

/**
 * Fetch downloaded items for home section
 */
export async function fetchDownloadedItems(): Promise<LibraryItem[]> {
  try {
    const results = await db
      .select()
      .from(downloads)
      .where(eq(downloads.status, 'completed'))
      .orderBy(desc(downloads.completedAt))
      .limit(10);
    
    return results.map((d) => ({
      id: d.imdbId,
      type: d.type as 'movie' | 'series',
      name: d.title,
      poster: d.posterUrl || '',
      year: undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch downloaded items:', error);
    return [];
  }
} 
