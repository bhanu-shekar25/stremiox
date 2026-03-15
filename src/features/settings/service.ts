import { getInfoAsync, cacheDirectory, documentDirectory } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/core/db';
import { downloads } from '@/core/db/schema';
import { eq } from 'drizzle-orm';
import { deleteDownload } from '@/features/downloads/engine';

/**
 * Get total storage used by downloads
 */
export async function getTotalStorageUsed(): Promise<number> {
  try {
    const downloadsDir = (cacheDirectory || documentDirectory || './') + 'stremiox_downloads/';

    const dirInfo = await getInfoAsync(downloadsDir);
    if (!dirInfo.exists) return 0;

    // Get total size (this is a simplified version)
    // In production, you'd iterate through all files and sum their sizes
    return dirInfo.size || 0;
  } catch (error) {
    console.error('Failed to get storage used:', error);
    return 0;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Delete all downloads
 */
export async function deleteAllDownloads(): Promise<void> {
  try {
    const allDownloads = await db.select().from(downloads).all();
    
    for (const download of allDownloads) {
      await deleteDownload(download.id);
    }
  } catch (error) {
    console.error('Failed to delete all downloads:', error);
    throw error;
  }
}

/**
 * Clear app cache (AsyncStorage)
 */
export async function clearCache(): Promise<void> {
  try {
    // Clear non-critical cached data
    // Keep auth and downloads data
    const keys = await AsyncStorage.getAllKeys();
    const keysToClear = keys.filter(
      (key) => !key.includes('stremiox-auth') && !key.includes('stremiox-downloads')
    );
    
    await AsyncStorage.multiRemove(keysToClear);
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Get app version from package info
 */
export function getAppVersion(): string {
  return '1.0.0';
} 
