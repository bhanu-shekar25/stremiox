export interface StremioUser {
  _id: string;
  email: string;
  authKey: string;
}

export interface LibraryItem {
  id: string;
  type: 'movie' | 'series';
  name: string;
  poster: string;
  background?: string;
  year?: number;
  imdbRating?: number;
  genres?: string[];
  description?: string;
  runtime?: string;
  cast?: string[];
  director?: string[];
}

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  overview?: string;
  thumbnail?: string;
  released?: string;
}

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  logo?: string;
  transportUrl: string;
  resources: (string | { name: string; types: string[] })[];
  types: string[];
  catalogs?: CatalogDefinition[];
  behaviorHints?: { adult?: boolean; configurable?: boolean };
}

export interface CatalogDefinition {
  type: string;
  id: string;
  name: string;
  extra?: { name: string; isRequired?: boolean; options?: string[] }[];
}

export interface Stream {
  name?: string;
  title?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  behaviorHints?: { bingeGroup?: string; filename?: string; videoSize?: number };
  quality?: string;
  isRDCached?: boolean;
  addonId?: string;
  addonName?: string;
}

export interface Subtitle {
  id: string;
  url: string;
  lang: string;
  langName: string;
}

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';

export interface Download {
  id: string;
  imdbId: string;
  type: 'movie' | 'series';
  title: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  posterUrl?: string;
  streamName?: string;
  streamUrl: string;
  directUrl?: string;
  localPath?: string;
  fileSize?: number;
  quality?: string;
  addonId?: string;
  status: DownloadStatus;
  progress: number;
  downloadedBytes: number;
  subtitlePath?: string;
  subtitleLang?: string;
  createdAt: number;
  completedAt?: number;
}

export interface WatchProgress {
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
  updatedAt: number;
}

export interface PlayerParams {
  id: string;
  url: string;
  title: string;
  poster?: string;
  startPositionMs?: number;
  subtitlePath?: string;
  isOffline: boolean;
  type: 'movie' | 'series';
  imdbId: string;
  season?: number;
  episode?: number;
} 
