import { useAddonStore } from '@/features/addons/store';
import { getAddonsByResource, buildStreamUrl } from '@/features/addons/parser';
import { cinemetaAxios } from '@/core/api/axios';
import type { Stream, AddonManifest } from '@/types';

interface StreamResponse {
  streams: Array<{
    name?: string;
    title?: string;
    url?: string;
    infoHash?: string;
    fileIdx?: number;
    behaviorHints?: {
      bingeGroup?: string;
      filename?: string;
      videoSize?: number;
    };
  }>;
}

/**
 * Parse quality from stream name/title
 */
function parseQuality(stream: Stream): string {
  const text = `${stream.name || ''} ${stream.title || ''}`.toLowerCase();
  
  if (text.includes('4k') || text.includes('2160p')) return '4K';
  if (text.includes('1080p')) return '1080p';
  if (text.includes('720p')) return '720p';
  if (text.includes('480p')) return '480p';
  if (text.includes('360p')) return '360p';
  
  return 'Unknown';
}

/**
 * Check if stream is RD cached
 */
function isRDCached(stream: Stream): boolean {
  const text = `${stream.name || ''} ${stream.title || ''}`;
  return text.includes('⚡') || text.includes('[RD+') || text.includes('RD cache');
}

/**
 * Fetch streams from a single add-on with timeout
 */
async function fetchAddonStreams(
  addon: AddonManifest,
  type: string,
  id: string,
  season?: number,
  episode?: number
): Promise<Stream[]> {
  const url = buildStreamUrl(addon, type, id, season, episode);
  
  try {
    const response = await cinemetaAxios.get<StreamResponse>(url, {
      timeout: 10000, // 10 second timeout
    });
    
    return response.data.streams.map((s) => ({
      name: s.name,
      title: s.title,
      url: s.url,
      infoHash: s.infoHash,
      fileIdx: s.fileIdx,
      behaviorHints: s.behaviorHints,
      quality: parseQuality(s as Stream),
      isRDCached: isRDCached(s as Stream),
      addonId: addon.id,
      addonName: addon.name,
    }));
  } catch (error) {
    console.warn(`Stream fetch failed for ${addon.name}:`, error);
    return [];
  }
}

/**
 * Fetch streams from all installed add-ons
 * Returns deduplicated, sorted stream list
 */
export async function getStreamsFromAllAddons(
  type: 'movie' | 'series',
  imdbId: string,
  season?: number,
  episode?: number
): Promise<Stream[]> {
  const addons = useAddonStore.getState().addons;
  
  // Filter to stream addons that support this type
  const streamAddons = getAddonsByResource(addons, 'stream').filter(
    (addon) => addon.types.includes(type)
  );
  
  if (streamAddons.length === 0) {
    return [];
  }
  
  // Fetch from all addons in parallel with timeout
  const results = await Promise.allSettled(
    streamAddons.map((addon) =>
      fetchAddonStreams(addon, type, imdbId, season, episode)
    )
  );
  
  // Flatten results
  const allStreams = results
    .filter((r): r is PromiseFulfilledResult<Stream[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
  
  // Sort: RD cached first, then by quality, then by addon
  const qualityOrder: Record<string, number> = {
    '4K': 0,
    '1080p': 1,
    '720p': 2,
    '480p': 3,
    '360p': 4,
    'Unknown': 5,
  };
  
  allStreams.sort((a, b) => {
    // RD cached first
    if (a.isRDCached && !b.isRDCached) return -1;
    if (!a.isRDCached && b.isRDCached) return 1;
    
    // Then by quality
    const aQuality = a.quality || 'Unknown';
    const bQuality = b.quality || 'Unknown';
    const qualityDiff = (qualityOrder[aQuality] || 5) - (qualityOrder[bQuality] || 5);
    if (qualityDiff !== 0) return qualityDiff;
    
    // Then by addon name
    return (a.addonName || '').localeCompare(b.addonName || '');
  });
  
  // Deduplicate by url || infoHash
  const seen = new Set<string>();
  const uniqueStreams: Stream[] = [];
  
  for (const stream of allStreams) {
    const key = stream.url || stream.infoHash || '';
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueStreams.push(stream);
    }
  }
  
  return uniqueStreams;
} 
