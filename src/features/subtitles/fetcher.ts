import { useAddonStore } from '@/features/addons/store';
import { getAddonsByResource } from '@/features/addons/parser';
import { cinemetaAxios } from '@/core/api/axios';
import type { Subtitle } from '@/types';

interface SubtitleResponse {
  subtitles: Array<{
    id: string;
    url: string;
    lang: string;
  }>;
}

/**
 * Fetch subtitles from all subtitle addons
 */
export async function getSubtitles(
  type: 'movie' | 'series',
  id: string,
  season?: number,
  episode?: number
): Promise<Subtitle[]> {
  const addons = useAddonStore.getState().addons;
  
  // Filter to subtitle addons
  const subtitleAddons = getAddonsByResource(addons, 'subtitles');
  
  if (subtitleAddons.length === 0) {
    return [];
  }
  
  // Build ID string
  let idString = id;
  if (type === 'series' && season !== undefined && episode !== undefined) {
    idString = `${id}:${season}:${episode}`;
  }
  
  // Fetch from all subtitle addons in parallel
  const results = await Promise.allSettled(
    subtitleAddons.map(async (addon) => {
      const url = `${addon.transportUrl.replace(/\/$/, '')}/subtitles/${type}/${idString}.json`;
      
      try {
        const response = await cinemetaAxios.get<SubtitleResponse>(url, {
          timeout: 10000,
        });
        
        return response.data.subtitles.map((sub) => ({
          id: sub.id,
          url: sub.url,
          lang: sub.lang,
          langName: getLanguageName(sub.lang),
        }));
      } catch (error) {
        console.warn(`Subtitle fetch failed for ${addon.name}:`, error);
        return [];
      }
    })
  );
  
  // Flatten results
  const allSubtitles = results
    .filter((r): r is PromiseFulfilledResult<Subtitle[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
  
  // Deduplicate by url
  const seen = new Set<string>();
  const uniqueSubtitles: Subtitle[] = [];
  
  for (const sub of allSubtitles) {
    if (!seen.has(sub.url)) {
      seen.add(sub.url);
      uniqueSubtitles.push(sub);
    }
  }
  
  // Sort: English first, then alphabetical by langName
  uniqueSubtitles.sort((a, b) => {
    if (a.lang === 'eng' && b.lang !== 'eng') return -1;
    if (a.lang !== 'eng' && b.lang === 'eng') return 1;
    return (a.langName || '').localeCompare(b.langName || '');
  });
  
  return uniqueSubtitles;
}

/**
 * Get language name from code
 */
function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    eng: 'English',
    spa: 'Spanish',
    fra: 'French',
    deu: 'German',
    ita: 'Italian',
    por: 'Portuguese',
    rus: 'Russian',
    jpn: 'Japanese',
    kor: 'Korean',
    chi: 'Chinese',
    ara: 'Arabic',
    hin: 'Hindi',
    tur: 'Turkish',
    pol: 'Polish',
    nld: 'Dutch',
    swe: 'Swedish',
    nor: 'Norwegian',
    dan: 'Danish',
    fin: 'Finnish',
    ces: 'Czech',
    hun: 'Hungarian',
    ron: 'Romanian',
    tha: 'Thai',
    vie: 'Vietnamese',
    ind: 'Indonesian',
    msA: 'Malay',
    heb: 'Hebrew',
    ell: 'Greek',
    ukR: 'Ukrainian',
  };
  
  return languages[code.toLowerCase()] || code;
} 
