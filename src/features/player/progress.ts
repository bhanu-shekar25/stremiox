import { db } from '@/core/db';
import { watchProgress } from '@/core/db/schema';
import { eq, sql } from 'drizzle-orm';

interface SaveProgressData {
  id: string;
  imdbId: string;
  type: 'movie' | 'series';
  title: string;
  season?: number;
  episode?: number;
  posterUrl?: string;
  positionMs: number;
  durationMs: number;
  isOffline: boolean;
}

/**
 * Save watch progress to database
 * Upserts if progress already exists
 */
export async function saveProgress(data: SaveProgressData): Promise<void> {
  await db
    .insert(watchProgress)
    .values({
      id: data.id,
      imdbId: data.imdbId,
      type: data.type,
      title: data.title,
      season: data.season,
      episode: data.episode,
      posterUrl: data.posterUrl,
      positionMs: data.positionMs,
      durationMs: data.durationMs,
      isOffline: data.isOffline ? 1 : 0,
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: watchProgress.id,
      set: {
        positionMs: data.positionMs,
        durationMs: data.durationMs,
        isOffline: data.isOffline ? 1 : 0,
        updatedAt: Date.now(),
      },
    });
}

/**
 * Load watch progress from database
 */
export async function loadProgress(id: string): Promise<SaveProgressData | null> {
  const result = await db
    .select()
    .from(watchProgress)
    .where(eq(watchProgress.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];
  return {
    id: row.id,
    imdbId: row.imdbId,
    type: row.type as 'movie' | 'series',
    title: row.title,
    season: row.season ?? undefined,
    episode: row.episode ?? undefined,
    posterUrl: row.posterUrl ?? undefined,
    positionMs: row.positionMs ?? 0,
    durationMs: row.durationMs ?? 0,
    isOffline: (row.isOffline ?? 0) === 1,
  };
}

/**
 * Mark content as completed (watched 100%)
 * This removes it from Continue Watching
 */
export async function markCompleted(id: string): Promise<void> {
  const progress = await loadProgress(id);
  if (!progress) return;

  await db
    .update(watchProgress)
    .set({
      positionMs: progress.durationMs,
      updatedAt: Date.now(),
    })
    .where(eq(watchProgress.id, id));
}

/**
 * Delete watch progress
 */
export async function deleteProgress(id: string): Promise<void> {
  await db.delete(watchProgress).where(eq(watchProgress.id, id));
}

/**
 * Format milliseconds to MM:SS
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 
