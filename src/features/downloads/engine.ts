import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { db } from '@/core/db';
import { downloads as downloadsTable } from '@/core/db/schema';
import { eq } from 'drizzle-orm';
import { resolveStreamUrl } from './realdebrid';
import {
  showProgressNotification,
  showCompleteNotification,
  showFailureNotification,
  dismissNotification,
} from './notifications';
import type { Stream, LibraryItem, DownloadStatus } from '@/types';
import { getSubtitles } from '@/features/subtitles/fetcher';
import { downloadSubtitle } from '@/features/subtitles/downloader';

// Downloads directory path - will be resolved at runtime
let DOWNLOADS_DIR: string | null = null;

const getDownloadsDir = async (): Promise<string> => {
  if (!DOWNLOADS_DIR) {
    // Use cacheDirectory from expo-file-system (cast to any to bypass type issues)
    const fs = FileSystem as any;
    DOWNLOADS_DIR = (fs.cacheDirectory || fs.documentDirectory || './') + 'stremiox_downloads/';
  }
  return DOWNLOADS_DIR;
};

const MAX_CONCURRENT = 2;

// Active resumable download instances (keyed by download ID)
const activeResumables: Record<string, any> = {};

// Track last notification update time (for rate limiting)
const lastNotificationUpdate: Record<string, number> = {};

/**
 * Generate a unique download ID
 */
function generateId(): string {
  return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get filename from stream or URL
 */
function getFilename(stream: Stream, url?: string): string {
  if (stream.behaviorHints?.filename) {
    return stream.behaviorHints.filename;
  }
  
  if (url) {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'download.mp4';
  }
  
  return `download_${Date.now()}.mp4`;
}

/**
 * Queue a new download
 */
export async function queueDownload(params: {
  stream: Stream;
  meta: LibraryItem;
  season?: number;
  episode?: number;
}): Promise<string> {
  const id = generateId();
  
  const download = {
    id,
    imdbId: params.meta.id,
    type: params.meta.type,
    title: params.meta.name,
    season: params.season,
    episode: params.episode,
    episodeTitle: undefined,
    posterUrl: params.meta.poster,
    streamName: params.stream.name,
    streamUrl: params.stream.url || '',
    directUrl: null,
    localPath: null,
    fileSize: params.stream.behaviorHints?.videoSize || null,
    quality: params.stream.quality,
    addonId: params.stream.addonId,
    status: 'queued' as DownloadStatus,
    progress: 0,
    downloadedBytes: 0,
    subtitlePath: null,
    subtitleLang: null,
    createdAt: Date.now(),
    completedAt: null,
  };

  // Insert into SQLite
  await db.insert(downloadsTable).values(download);

  // Check if we can start downloading
  const activeCount = Object.keys(activeResumables).length;
  if (activeCount < MAX_CONCURRENT) {
    processDownload(id, params.stream);
  }

  return id;
}

/**
 * Process a download (resolve URL and start downloading)
 */
export async function processDownload(
  downloadId: string,
  stream: Stream
): Promise<void> {
  try {
    // Update status to downloading
    await db
      .update(downloadsTable)
      .set({ status: 'downloading' })
      .where(eq(downloadsTable.id, downloadId));

    // Resolve direct URL via Real-Debrid
    const directUrl = await resolveStreamUrl(stream.url, stream.infoHash);

    // Update direct URL in DB
    await db
      .update(downloadsTable)
      .set({ directUrl })
      .where(eq(downloadsTable.id, downloadId));

    // Ensure downloads directory exists
    const dirPath = (await getDownloadsDir()) + downloadId;
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }

    // Set local path
    const filename = getFilename(stream, directUrl);
    const localPath = dirPath + '/' + filename;

    // Show progress notification
    const downloadResult = await db
      .select()
      .from(downloadsTable)
      .where(eq(downloadsTable.id, downloadId))
      .limit(1);
    
    const download = downloadResult[0];
    
    if (download) {
      await showProgressNotification(
        downloadId,
        download.title,
        0
      );
    }

    // Create download with BACKGROUND session
    const resumable = FileSystem.createDownloadResumable(
      directUrl,
      localPath,
      {
        sessionType: 1, // BACKGROUND session type
        headers: {
          'User-Agent': 'StremioX/1.0',
        },
      },
      (progress) => onProgress(downloadId, progress)
    );

    // Store resumable
    activeResumables[downloadId] = resumable;

    // Start download
    const result = await resumable.downloadAsync();

    // On success
    await db
      .update(downloadsTable)
      .set({
        status: 'completed',
        localPath,
        progress: 1,
        downloadedBytes: result.totalBytesWritten,
        completedAt: Date.now(),
      })
      .where(eq(downloadsTable.id, downloadId));

    // Show complete notification
    const completedResult = await db
      .select()
      .from(downloadsTable)
      .where(eq(downloadsTable.id, downloadId))
      .limit(1);
    
    const completed = completedResult[0];
    
    if (completed) {
      await showCompleteNotification(completed.title);
      await dismissNotification(downloadId);
      
      // Auto-download English subtitle (non-fatal if fails)
      try {
        const subs = await getSubtitles(
          completed.type as 'movie' | 'series',
          completed.imdbId,
          completed.season ?? undefined,
          completed.episode ?? undefined
        );
        
        const englishSub = subs.find((s) => s.lang === 'eng') || subs[0];
        if (englishSub) {
          const subPath = await downloadSubtitle(englishSub, downloadId);
          await db
            .update(downloadsTable)
            .set({
              subtitlePath: subPath,
              subtitleLang: englishSub.lang,
            })
            .where(eq(downloadsTable.id, downloadId));
        }
      } catch (error) {
        console.warn('Auto-subtitle download failed (non-fatal):', error);
      }
    }

    // Remove from active
    delete activeResumables[downloadId];
    delete lastNotificationUpdate[downloadId];

    // Start next queued download
    startNextQueued();
  } catch (error) {
    console.error('Download failed:', error);
    
    // On error
    await db
      .update(downloadsTable)
      .set({
        status: 'failed',
      })
      .where(eq(downloadsTable.id, downloadId));

    // Show failure notification
    const failedResult = await db
      .select()
      .from(downloadsTable)
      .where(eq(downloadsTable.id, downloadId))
      .limit(1);
    
    const failed = failedResult[0];
    
    if (failed) {
      await showFailureNotification(
        failed.title,
        error instanceof Error ? error.message : 'Unknown error'
      );
      await dismissNotification(downloadId);
    }

    // Remove from active
    delete activeResumables[downloadId];
    delete lastNotificationUpdate[downloadId];

    // Start next queued download
    startNextQueued();
  }
}

/**
 * Handle download progress updates
 */
function onProgress(
  downloadId: string,
  progress: any
): void {
  const now = Date.now();
  
  // Rate limit notification updates to every 500ms
  const lastUpdate = lastNotificationUpdate[downloadId] || 0;
  if (now - lastUpdate < 500) return;
  
  lastNotificationUpdate[downloadId] = now;

  const progressPercent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
  const speedKBps = progress.totalBytesWritten / ((now - lastUpdate) / 1000) / 1024;

  // Update SQLite
  db.update(downloadsTable)
    .set({
      progress: progressPercent,
      downloadedBytes: progress.totalBytesWritten,
    })
    .where(eq(downloadsTable.id, downloadId))
    .catch(console.error);

  // Update notification
  db.select()
    .from(downloadsTable)
    .where(eq(downloadsTable.id, downloadId))
    .limit(1)
    .then((results) => {
      const download = results[0];
      if (download) {
        showProgressNotification(
          downloadId,
          download.title,
          progressPercent,
          speedKBps
        ).catch(console.error);
      }
    })
    .catch(console.error);
}

/**
 * Start the next queued download
 */
async function startNextQueued(): Promise<void> {
  const activeCount = Object.keys(activeResumables).length;
  if (activeCount >= MAX_CONCURRENT) return;

  const queued = await db
    .select()
    .from(downloadsTable)
    .where(eq(downloadsTable.status, 'queued'))
    .limit(1)
    .get();

  if (queued) {
    // Would need stream data here - simplified for now
    console.log('Would start queued download:', queued.id);
  }
}

/**
 * Pause a download
 */
export async function pauseDownload(downloadId: string): Promise<void> {
  const resumable = activeResumables[downloadId];
  if (!resumable) return;

  try {
    const resumeData = await resumable.pauseAsync();
    
    // Save resume data (simplified - would need a column for this)
    await db
      .update(downloadsTable)
      .set({ status: 'paused' })
      .where(eq(downloadsTable.id, downloadId));

    await dismissNotification(downloadId);
  } catch (error) {
    console.error('Pause failed:', error);
  }
}

/**
 * Resume a paused download
 */
export async function resumeDownload(downloadId: string): Promise<void> {
  const download = await db
    .select()
    .from(downloadsTable)
    .where(eq(downloadsTable.id, downloadId))
    .get();

  if (!download || !download.directUrl || !download.localPath) return;

  try {
    await db
      .update(downloadsTable)
      .set({ status: 'downloading' })
      .where(eq(downloadsTable.id, downloadId));

    const resumable = FileSystem.createDownloadResumable(
      download.directUrl,
      download.localPath,
      {
        sessionType: 1, // BACKGROUND session type
      },
      (progress) => onProgress(downloadId, progress)
    );

    activeResumables[downloadId] = resumable;
    await resumable.downloadAsync();
  } catch (error) {
    console.error('Resume failed:', error);
  }
}

/**
 * Cancel a download
 */
export async function cancelDownload(downloadId: string): Promise<void> {
  const resumable = activeResumables[downloadId];
  
  if (resumable) {
    await resumable.cancelAsync();
    delete activeResumables[downloadId];
  }

  // Delete partial file
  const download = await db
    .select()
    .from(downloadsTable)
    .where(eq(downloadsTable.id, downloadId))
    .get();

  if (download?.localPath) {
    try {
      await FileSystem.deleteAsync(download.localPath);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  // Remove from DB
  await db
    .delete(downloadsTable)
    .where(eq(downloadsTable.id, downloadId));

  await dismissNotification(downloadId);
  delete lastNotificationUpdate[downloadId];
}

/**
 * Delete a completed download
 */
export async function deleteDownload(downloadId: string): Promise<void> {
  const download = await db
    .select()
    .from(downloadsTable)
    .where(eq(downloadsTable.id, downloadId))
    .get();

  if (!download) return;

  // Delete file/directory
  if (download.localPath) {
    try {
      const dirPath = (await getDownloadsDir()) + downloadId;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(dirPath, { idempotent: true });
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  // Remove from DB
  await db
    .delete(downloadsTable)
    .where(eq(downloadsTable.id, downloadId));

  // Start next queued download
  startNextQueued();
}

/**
 * Get all downloads
 */
export async function getAllDownloads() {
  return db.select().from(downloadsTable).all();
}

/**
 * Get downloads by status
 */
export async function getDownloadsByStatus(status: DownloadStatus) {
  return db
    .select()
    .from(downloadsTable)
    .where(eq(downloadsTable.status, status))
    .all();
}
