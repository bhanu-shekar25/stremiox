import * as FileSystem from 'expo-file-system';
import type { Subtitle } from '@/types';

/**
 * Get the downloads directory path
 */
const getDownloadsDir = async (): Promise<string> => {
  const fs = FileSystem as any;
  return (fs.cacheDirectory || fs.documentDirectory || './') + 'stremiox_downloads/';
};

/**
 * Download subtitle file for a download
 * Returns local file path
 */
export async function downloadSubtitle(
  subtitle: Subtitle,
  downloadId: string
): Promise<string> {
  const downloadsDir = await getDownloadsDir();
  const downloadDir = downloadsDir + downloadId;
  
  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(downloadDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
  }
  
  // Download subtitle file
  const filename = `subtitle_${subtitle.lang}.srt`;
  const localPath = downloadDir + '/' + filename;
  
  await FileSystem.downloadAsync(subtitle.url, localPath);
  
  return localPath;
}

/**
 * Download multiple subtitles (for multi-language support)
 */
export async function downloadSubtitles(
  subtitles: Subtitle[],
  downloadId: string
): Promise<string[]> {
  const paths: string[] = [];
  
  for (const subtitle of subtitles) {
    try {
      const path = await downloadSubtitle(subtitle, downloadId);
      paths.push(path);
    } catch (error) {
      console.warn(`Failed to download ${subtitle.lang} subtitle:`, error);
    }
  }
  
  return paths;
} 
