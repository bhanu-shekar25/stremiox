# StremioX - Domain Models & Business Logic

## Core Domain Entities

### User & Authentication

```typescript
interface StremioUser {
  _id: string;      // Stremio user ID
  email: string;
  authKey: string;  // Persistent auth token
}
```

**Business Rules:**
- Auth key must be stored in SecureStore (encrypted)
- Auth state persists across app restarts
- Logout clears all local data associated with user

### Media Content

```typescript
interface LibraryItem {
  id: string;           // Stremio meta ID
  type: 'movie' | 'series';
  name: string;
  poster: string;       // Poster image URL
  background?: string;  // Background image URL
  year?: number;
  imdbRating?: number;
  genres?: string[];
  description?: string;
  runtime?: string;
  cast?: string[];
  director?: string[];
}

interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  overview?: string;
  thumbnail?: string;
  released?: string;
}
```

**Business Rules:**
- All content identified by IMDb ID (imdbId)
- Series episodes have compound identity (imdbId + season + episode)
- Metadata fetched from Cinemeta API

### Streams

```typescript
interface Stream {
  name?: string;        // Stream source name
  title?: string;       // Quality/resolution info
  url?: string;         // Direct URL (if available)
  infoHash?: string;    // Torrent info hash
  fileIdx?: number;     // File index in torrent
  quality?: string;     // e.g., "1080p", "4K"
  isRDCached?: boolean; // Real-Debrid cached flag
  addonId?: string;     // Source addon ID
  addonName?: string;   // Source addon name
}
```

**Business Rules:**
- Streams fetched from all installed add-ons
- Real-Debrid cached streams prioritized
- Quality parsed from stream title using regex patterns

### Add-ons

```typescript
interface AddonManifest {
  id: string;
  version: string;
  name: string;
  transportUrl: string;  // Base URL for addon API
  resources: string[];   // ["stream", "meta", "catalog"]
  types: string[];       // ["movie", "series"]
  catalogs: CatalogDefinition[];
}
```

**Business Rules:**
- Add-ons installed via Stremio API
- Add-on manifests define available resources

### Downloads

```typescript
type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';

interface Download {
  id: string;           // Unique download ID
  imdbId: string;       // Content IMDb ID
  type: 'movie' | 'series';
  title: string;
  season?: number;
  episode?: number;
  streamUrl: string;    // Original stream URL
  directUrl?: string;   // Real-Debrid direct URL
  localPath?: string;   // Local file path after download
  status: DownloadStatus;
  progress: number;     // 0.0 to 1.0
  createdAt: number;    // Timestamp
  completedAt?: number; // Timestamp
}
```

**Business Rules:**
- Downloads managed by OS native download manager (BACKGROUND session)
- Real-Debrid torrent must be cached before download starts
- Download progress persisted to SQLite
- Android requires foreground service notification for large downloads

### Watch Progress

```typescript
interface WatchProgress {
  id: string;
  imdbId: string;
  type: 'movie' | 'series';
  title: string;
  season?: number;
  episode?: number;
  positionMs: number;   // Current position in ms
  durationMs: number;   // Total duration in ms
  isOffline: boolean;
  updatedAt: number;
}
```

**Business Rules:**
- Progress updated periodically during playback (every 5-10 seconds)
- "Continue Watching" shows items with position > 0 and position < duration

## Database Schema (Drizzle)

### downloads table
- id: text (PK)
- imdbId: text (NOT NULL)
- type: text (NOT NULL)
- title: text (NOT NULL)
- season: integer
- episode: integer
- streamUrl: text (NOT NULL)
- directUrl: text
- localPath: text
- status: text (NOT NULL)
- progress: real (default 0)
- createdAt: integer (NOT NULL)
- completedAt: integer

### watch_progress table
- id: text (PK)
- imdbId: text (NOT NULL)
- type: text (NOT NULL)
- title: text (NOT NULL)
- season: integer
- episode: integer
- positionMs: integer (default 0)
- durationMs: integer (default 0)
- isOffline: integer (default 0)
- updatedAt: integer (NOT NULL)

## Business Logic Rules

### Stream Selection Priority
1. Real-Debrid cached streams (highest priority)
2. Direct HTTP streams
3. Torrent streams (requires Real-Debrid caching)

### Download Flow
1. User selects stream to download
2. If torrent, submit magnet to Real-Debrid
3. Poll torrent status with exponential backoff
4. Once cached, get direct URL
5. Start background download with OS manager
6. Show progress notification
7. On completion, move file to permanent location

### Rate Limiting
- Real-Debrid API: max 2 concurrent requests
- Torrent polling: exponential backoff (3s, 5s, 8s, 13s, 21s)
- Max wait time: 3 minutes
