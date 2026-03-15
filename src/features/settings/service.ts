// ✅ FIX: Use the new expo-file-system v55 API correctly
// Paths.info() doesn't exist — use Directory.info() method instead
import { Paths, Directory } from 'expo-file-system';
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
    const downloadsDir = new Directory(Paths.cache, 'stremiox_downloads');

    // Check if directory exists first
    if (!downloadsDir.exists) return 0;

    // Iterate through files and sum their sizes
    let totalSize = 0;
    const contents = downloadsDir.list();

    for (const item of contents) {
      // Use the File/Directory's size property directly
      if ('size' in item && typeof item.size === 'number') {
        totalSize += item.size;
      }
    }

    return totalSize;
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
