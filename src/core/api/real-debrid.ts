import { rdAxios } from './axios';

/**
 * Real-Debrid API service for resolving torrent streams
 */

interface TorrentInfo {
  id: string;
  filename: string;
  original_bytes: number;
  host: string;
  split: number;
  progress: number;
  status: string;
  added: string;
  links: string[];
  ended: string;
  speed: number;
  seeders: number;
}

interface UnrestrictedLink {
  id: string;
  filename: string;
  mimeType: string;
  original: string;
  host: string;
  chunks: number;
  crc: number;
  download: string;
}

/**
 * Add a torrent magnet/link to Real-Debrid
 */
export async function addTorrent(magnetOrInfoHash: string): Promise<TorrentInfo> {
  try {
    // First, try to add as instant link (for infoHash)
    const response = await rdAxios.post('/torrents/addMagnet', {
      magnet: magnetOrInfoHash.startsWith('magnet:') 
        ? magnetOrInfoHash 
        : `magnet:?xt=urn:btih:${magnetOrInfoHash}`
    });
    
    const torrentId = response.data.id;
    
    // Select all files
    await rdAxios.post(`/torrents/selectFiles/${torrentId}`, {
      files: 'all'
    });
    
    // Get torrent info
    const infoResponse = await rdAxios.get(`/torrents/info/${torrentId}`);
    return infoResponse.data;
  } catch (error) {
    console.error('Real-Debrid addTorrent failed:', error);
    throw error;
  }
}

/**
 * Get torrent info from Real-Debrid
 */
export async function getTorrentInfo(torrentId: string): Promise<TorrentInfo> {
  try {
    const response = await rdAxios.get(`/torrents/info/${torrentId}`);
    return response.data;
  } catch (error) {
    console.error('Real-Debrid getTorrentInfo failed:', error);
    throw error;
  }
}

/**
 * Unrestrict a Real-Debrid link to get direct download URL
 */
export async function unrestrictLink(link: string): Promise<UnrestrictedLink> {
  try {
    const response = await rdAxios.post('/unrestrict/link', {
      link
    });
    return response.data;
  } catch (error) {
    console.error('Real-Debrid unrestrictLink failed:', error);
    throw error;
  }
}

/**
 * Resolve a torrent infoHash to a playable stream URL via Real-Debrid
 */
export async function resolveTorrentStream(
  infoHash: string,
  fileIdx: number = 0
): Promise<string | null> {
  try {
    console.log('[RD] Resolving torrent:', infoHash, 'file:', fileIdx);
    
    // Add torrent to RD
    const torrent = await addTorrent(infoHash);
    console.log('[RD] Torrent added:', torrent.id, 'status:', torrent.status);
    
    // Wait for torrent to be ready
    if (torrent.status === 'magnet_error') {
      throw new Error('Invalid magnet link');
    }
    
    if (torrent.status === 'downloading' || torrent.status === 'magnet_conversion') {
      // Poll until ready (max 30 seconds)
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updated = await getTorrentInfo(torrent.id);
        
        if (updated.status === 'downloaded') {
          console.log('[RD] Torrent downloaded, links:', updated.links);
          if (updated.links && updated.links.length > fileIdx) {
            const unrestricted = await unrestrictLink(updated.links[fileIdx]);
            console.log('[RD] Unrestricted URL:', unrestricted.download);
            return unrestricted.download;
          }
          break;
        }
        
        if (updated.status === 'error' || updated.status === 'dead') {
          throw new Error('Torrent failed to download');
        }
        
        attempts++;
      }
    } else if (torrent.status === 'downloaded') {
      // Already downloaded
      console.log('[RD] Torrent already downloaded, links:', torrent.links);
      if (torrent.links && torrent.links.length > fileIdx) {
        const unrestricted = await unrestrictLink(torrent.links[fileIdx]);
        console.log('[RD] Unrestricted URL:', unrestricted.download);
        return unrestricted.download;
      }
    }
    
    // If we have links, try to unrestrict
    if (torrent.links && torrent.links.length > fileIdx) {
      const unrestricted = await unrestrictLink(torrent.links[fileIdx]);
      return unrestricted.download;
    }
    
    return null;
  } catch (error) {
    console.error('[RD] Failed to resolve torrent:', error);
    return null;
  }
}

/**
 * Check if a stream has Real-Debrid cached link
 */
export function getRDCachedStreamUrl(stream: any): string | null {
  // Some addons include direct RD URLs in the stream object
  if (stream.url && stream.url.includes('real-debrid.com')) {
    return stream.url;
  }
  return null;
}
