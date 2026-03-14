import { rdAxios } from '@/core/api/axios';
import { rdQueue } from './rdQueue';

export interface RDAccount {
  id: number;
  username: string;
  email: string;
  premium: number; // 0 = free, 1 = premium
  expiration: string;
}

export interface RDUnrestrictResponse {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  host_icon: string;
  download: string;
  streamable: number;
}

export interface RDTorrentInfo {
  id: string;
  filename: string;
  original_filename: string;
  hash: string;
  bytes: number;
  original_bytes: number;
  host: string;
  split: number;
  progress: number;
  status: 'magnet_error' | 'downloading' | 'downloaded' | 'error' | 'waiting_files_selection' | 'queued' | 'dead';
  added: string;
  links: string[];
  ended: string;
  speed: number;
  seeders: number;
}

/**
 * Verify Real-Debrid API key and get account info
 */
export async function getAccount(apiKey: string): Promise<RDAccount> {
  try {
    const response = await rdAxios.get<RDAccount>('/user');
    return response.data;
  } catch (error) {
    console.error('RD account verification failed:', error);
    throw new Error('Invalid Real-Debrid API key');
  }
}

/**
 * Unrestrict a direct link (for premium hosts)
 */
export async function unrestrictLink(url: string): Promise<string> {
  try {
    const response = await rdAxios.post<RDUnrestrictResponse>('/unrestrict/link', {
      link: url,
    });
    return response.data.download;
  } catch (error) {
    console.error('RD unrestrict failed:', error);
    throw new Error('Failed to unrestrict link');
  }
}

/**
 * Add magnet link to Real-Debrid
 */
export async function addMagnet(magnet: string): Promise<string> {
  try {
    const response = await rdAxios.post<{ id: string }>('/torrents/addMagnet', {
      magnet,
    });
    return response.data.id;
  } catch (error) {
    console.error('RD add magnet failed:', error);
    throw new Error('Failed to add magnet');
  }
}

/**
 * Select all files in a torrent
 */
export async function selectAllFiles(torrentId: string): Promise<void> {
  try {
    await rdAxios.post(`/torrents/selectFiles/${torrentId}`, {
      files: 'all',
    });
  } catch (error) {
    console.error('RD select files failed:', error);
    throw new Error('Failed to select files');
  }
}

/**
 * Get torrent info
 */
export async function getTorrentInfo(torrentId: string): Promise<RDTorrentInfo> {
  try {
    const response = await rdAxios.get<RDTorrentInfo>(`/torrents/info/${torrentId}`);
    return response.data;
  } catch (error) {
    console.error('RD torrent info failed:', error);
    throw error;
  }
}

/**
 * Poll torrent until ready with exponential backoff
 * Max wait: 3 minutes
 */
async function pollTorrentUntilReady(torrentId: string): Promise<string> {
  const delays = [3000, 5000, 8000, 13000, 21000, 34000]; // Fibonacci-ish backoff
  const MAX_WAIT_MS = 3 * 60 * 1000; // 3 minutes
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < MAX_WAIT_MS) {
    const info = await getTorrentInfo(torrentId);

    if (info.status === 'downloaded') {
      return info.links[0];
    }

    if (['error', 'dead', 'magnet_error'].includes(info.status)) {
      throw new Error(`RD torrent failed with status: ${info.status}`);
    }

    const delay = delays[Math.min(attempt, delays.length - 1)];
    await new Promise((resolve) => setTimeout(resolve, delay));
    attempt++;
  }

  throw new Error('RD torrent caching timed out after 3 minutes');
}

/**
 * Convert magnet to direct download URL
 * Uses rdQueue to enforce concurrency limit
 */
export async function magnetToDirectUrl(magnet: string): Promise<string> {
  return rdQueue.add(async () => {
    // Step 1: Add magnet
    const torrentId = await addMagnet(magnet);

    // Step 2: Select all files
    await selectAllFiles(torrentId);

    // Step 3: Poll until ready
    const directLink = await pollTorrentUntilReady(torrentId);

    // Step 4: Unrestrict the link
    return unrestrictLink(directLink);
  });
}

/**
 * Resolve any stream to a direct download URL
 * Handles both direct URLs and magnets
 */
export async function resolveStreamUrl(
  url?: string,
  infoHash?: string
): Promise<string> {
  if (url) {
    return rdQueue.add(() => unrestrictLink(url));
  }

  if (infoHash) {
    const magnet = `magnet:?xt=urn:btih:${infoHash}`;
    return magnetToDirectUrl(magnet);
  }

  throw new Error('Stream has no URL or infoHash');
} 
