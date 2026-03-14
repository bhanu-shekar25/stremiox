# StremioX — Complete Build Plan v3 (Final)
### React Native + Expo Dev Build | Offline Stremio with Real-Debrid Downloads
### ⚠️ Incorporates 5 critical native OS / architecture corrections from code review

---

## What We're Building

**StremioX** mirrors the official Stremio app UI (5-tab navigation, global search bar, black/purple dark theme) but replaces the "Addons" tab with a **Downloads** tab for offline viewing. Add-on management moves into Settings. The app uses `stremio-api-client` for auth + add-on sync, fetches streams from all installed add-ons, unrestricts them via Real-Debrid, and downloads MP4/MKV files locally for offline playback via VLC.

---

## ⚠️ 5 Critical Architecture Corrections (Read Before Coding)

These are non-negotiable fixes to prevent the app from failing at the OS level.

### Fix 1 — Background Downloads: Drop `expo-background-fetch`, use `FileSystem.BACKGROUND` session

**The problem:** `expo-background-fetch` is designed for lightweight API polling (wakes the app for a few seconds every 15+ minutes). It will NOT sustain a 4–40 GB video download in the background. iOS will kill it almost immediately. Android will kill it when the user leaves the app.

**The correct approach:** `expo-file-system`'s `createDownloadResumable` supports a native background session flag that hands the download off to the OS's native download manager (NSURLSession on iOS, DownloadManager on Android). The OS owns the download — the app can be killed and the download continues.

```typescript
// ✅ CORRECT — handed off to native OS download manager
const downloadResumable = FileSystem.createDownloadResumable(
  directUrl,
  localPath,
  {
    sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
    headers: { 'User-Agent': 'StremioX/1.0' },
  },
  progressCallback
);
```

**Android foreground service:** On Android, a persistent download notification is required to prevent the OS from killing the process for a large download. You must write a custom **Expo Config Plugin** that adds a `<service android:name=".DownloadService" android:foregroundServiceType="dataSync" />` entry to `AndroidManifest.xml`. Without this, Android 12+ will terminate the download when RAM pressure increases.

**Remove from project:** Do NOT install `expo-background-fetch` or `expo-task-manager`. Remove them entirely.

---

### Fix 2 — VLC Player: Requires a Custom Expo Config Plugin

**The problem:** `react-native-vlc-media-player` requires native linking — it modifies the Gradle build files (Android) and the Podfile (iOS). Expo's managed workflow does not handle this automatically. Without a Config Plugin, your EAS cloud build will fail.

**The correct approach:** Create a custom Config Plugin file at `plugins/withVLCPlayer.js`:

```javascript
// plugins/withVLCPlayer.js
const { withAppBuildGradle, withPodfile } = require('@expo/config-plugins');

const withVLCPlayer = (config) => {
  // Android: ensure minSdkVersion >= 21 (required by libVLC)
  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = mod.modResults.contents.replace(
      /minSdkVersion\s*=\s*\d+/,
      'minSdkVersion = 21'
    );
    return mod;
  });

  // iOS: disable bitcode (VLC prebuilt frameworks are not bitcode-compatible)
  config = withPodfile(config, (mod) => {
    if (!mod.modResults.contents.includes('ENABLE_BITCODE')) {
      mod.modResults.contents += `
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['ENABLE_BITCODE'] = 'NO'
    end
  end
end`;
    }
    return mod;
  });

  return config;
};

module.exports = withVLCPlayer;
```

Register it in `app.json`:
```json
"plugins": [
  "expo-router",
  "expo-font",
  ["expo-notifications", { "icon": "./assets/icon.png", "color": "#7b2fff" }],
  "./plugins/withVLCPlayer",
  "./plugins/withDownloadForegroundService"
]
```

Also create `plugins/withDownloadForegroundService.js` for Android foreground service (see Fix 1):
```javascript
// plugins/withDownloadForegroundService.js
const { withAndroidManifest } = require('@expo/config-plugins');

const withDownloadForegroundService = (config) => {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application[0];
    if (!app.service) app.service = [];
    app.service.push({
      $: {
        'android:name': '.DownloadForegroundService',
        'android:foregroundServiceType': 'dataSync',
        'android:exported': 'false',
      },
    });
    return mod;
  });
};

module.exports = withDownloadForegroundService;
```

---

### Fix 3 — Zustand: Use `persist` Middleware, Remove Manual `hydrate()` Calls

**The problem:** Manual `hydrate()` async functions called in `useEffect` in `_layout.tsx` create timing issues — screens can render before data is loaded, leading to flickers and race conditions.

**The correct approach:** Use Zustand's `persist` middleware with custom storage adapters. Zustand will handle hydration automatically before the first render.

**For auth store (uses `expo-secure-store`):**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: async (key: string) => await SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => await SecureStore.deleteItemAsync(key),
};

export const useAuthStore = create(
  persist(
    (set, get) => ({ /* store definition */ }),
    {
      name: 'stremiox-auth',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

**For download store (uses SQLite via Drizzle):**
```typescript
const sqliteStorage = {
  getItem: async (_key: string) => {
    const rows = await db.select().from(downloads);
    return JSON.stringify({ state: { downloads: rows } });
  },
  setItem: async (_key: string, value: string) => {
    // SQLite is source of truth — writes happen in engine.ts directly
    // This storage is read-only for hydration
  },
  removeItem: async (_key: string) => {},
};

export const useDownloadStore = create(
  persist(
    (set, get) => ({ /* store definition */ }),
    { name: 'stremiox-downloads', storage: createJSONStorage(() => sqliteStorage) }
  )
);
```

**Remove from `_layout.tsx`:** No `await hydrateAuth()` or `await hydrateDownloads()` calls needed. Zustand handles this automatically.

---

### Fix 4 — Real-Debrid Polling: Exponential Backoff + Request Queue

**The problem:** Polling `GET /torrents/info/{id}` every 3 seconds is aggressive. Real-Debrid will temporarily IP-ban accounts that hammer their API. Additionally, if users queue 3+ downloads simultaneously, firing all the magnet API requests at once can trigger rate limits.

**The correct approach:**

**Exponential backoff for polling:**
```typescript
async function pollTorrentUntilReady(torrentId: string, apiKey: string): Promise<string> {
  const delays = [3000, 5000, 8000, 13000, 21000]; // fibonacci-ish backoff
  let attempt = 0;
  const MAX_WAIT_MS = 3 * 60 * 1000; // 3-minute timeout
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_MS) {
    const info = await getTorrentInfo(torrentId, apiKey);

    if (info.status === 'downloaded') return info.links[0];
    if (info.status === 'error' || info.status === 'dead') {
      throw new Error(`Torrent failed with status: ${info.status}`);
    }

    const delay = delays[Math.min(attempt, delays.length - 1)];
    await sleep(delay);
    attempt++;
  }

  throw new Error('Torrent caching timed out after 3 minutes');
}
```

**RD request queue (concurrency lock):**
```typescript
// src/features/downloads/rdQueue.ts
import PQueue from 'p-queue'; // npm install p-queue

// Max 2 simultaneous RD API calls (unrestrict or magnet)
export const rdQueue = new PQueue({ concurrency: 2 });

// In engine.ts, wrap all RD calls:
const directUrl = await rdQueue.add(() =>
  resolveStreamUrl(stream, rdApiKey)
);
```

Install the queue library:
```bash
npm install p-queue
```

---

### Fix 5 — Drizzle ORM: Metro Config + Migration Setup

**The problem:** Drizzle generates `.sql` migration files that need to be read at runtime on the device. Metro bundler does not handle `.sql` files by default and will throw a `Unable to resolve module` error.

**The correct approach:**

**Step A — Update `metro.config.js`:**
```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .sql to the list of asset extensions so Metro bundles migration files
config.resolver.assetExts.push('sql');

module.exports = config;
```

**Step B — Install Babel plugin for inline SQL imports:**
```bash
npm install -D babel-plugin-inline-import
```

**Step C — Update `babel.config.js`:**
```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
```

**Step D — Migration runner in `src/core/db/index.ts`:**
```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations'; // auto-generated by drizzle-kit

const expo = openDatabaseSync('stremiox.db', { enableChangeListener: true });
export const db = drizzle(expo);

// Call once at app start (in app/_layout.tsx)
export async function initDB() {
  await migrate(db, migrations);
}
```

**Step E — Add drizzle.config.ts:**
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/core/db/schema.ts',
  out: './src/core/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
```

**Generate migrations after any schema change:**
```bash
npx drizzle-kit generate
```

---

## Updated Tech Stack

| Layer | Package | Purpose |
|---|---|---|
| Framework | React Native + Expo SDK 52 | Core |
| Navigation | Expo Router v4 | File-based routing |
| Stremio Auth | `stremio-api-client` | Official Stremio JS client |
| State | Zustand + `persist` middleware | Per-feature stores with auto-hydration |
| Local DB | expo-sqlite + drizzle-orm | Downloads & watch progress |
| File System | expo-file-system (BACKGROUND session) | Download & local storage |
| Video | react-native-vlc-media-player + Config Plugin | MKV, multi-audio, offline |
| Notifications | expo-notifications | Download progress & completion |
| ~~Background~~ | ~~expo-background-fetch~~ | ~~REMOVED — use FileSystem BACKGROUND~~ |
| RD Queue | p-queue | RD API concurrency control |
| HTTP | axios | API calls |
| Storage | @react-native-async-storage/async-storage | Stremio API client adapter |
| Secure Storage | expo-secure-store | Auth key persistence |
| Images | expo-image | Cached poster images |
| Icons | @expo/vector-icons (Ionicons) | Tab bar + UI icons |
| Gradients | expo-linear-gradient | Hero cards, overlays |

---

## Color Palette

```typescript
// src/core/theme/colors.ts
export const colors = {
  background:   '#0d0d0d',
  surface:      '#1a1a2e',
  surfaceAlt:   '#16213e',
  primary:      '#7b2fff',
  primaryLight: '#9b59f5',
  accent:       '#a855f7',
  textPrimary:  '#ffffff',
  textSecondary:'#a0a0b0',
  border:       '#2a2a3e',
  success:      '#22c55e',
  warning:      '#f59e0b',
  error:        '#ef4444',
  overlay:      'rgba(0,0,0,0.6)',
}
```

---

## Complete File Structure

```
stremiox/
│
├── app/                                    # Expo Router — routing & view shells ONLY
│   ├── _layout.tsx                         # Root: providers, fonts, auth gate, DB init
│   ├── (auth)/
│   │   └── login.tsx                       # Login screen (Stremio + RD key)
│   ├── (tabs)/
│   │   ├── _layout.tsx                     # Tab bar + custom header with search bar
│   │   ├── index.tsx                       # Tab 1: Home
│   │   ├── discover.tsx                    # Tab 2: Discover
│   │   ├── library.tsx                     # Tab 3: Library
│   │   ├── downloads.tsx                   # Tab 4: Downloads
│   │   └── settings.tsx                    # Tab 5: Settings
│   ├── search/
│   │   └── index.tsx                       # Full-screen search overlay
│   ├── detail/
│   │   └── [type]/
│   │       └── [id].tsx                    # Movie / Series detail
│   ├── player/
│   │   └── [id].tsx                        # VLC player (online OR offline)
│   └── addons/
│       └── index.tsx                       # Add-on manager (pushed from Settings)
│
├── plugins/                                # ✅ NEW — Expo Config Plugins (Fix 2)
│   ├── withVLCPlayer.js                    # VLC native linking + bitcode disable
│   └── withDownloadForegroundService.js    # Android foreground service for downloads
│
└── src/
    ├── core/
    │   ├── db/
    │   │   ├── schema.ts                   # Drizzle table definitions
    │   │   ├── index.ts                    # DB init, migrate(), exported db instance
    │   │   └── migrations/                 # ✅ Auto-generated by `npx drizzle-kit generate`
    │   ├── theme/
    │   │   ├── colors.ts
    │   │   └── typography.ts
    │   └── api/
    │       ├── axios.ts                    # Axios instances (stremio, cinemeta, rd)
    │       └── stremio.ts                  # StremioAPIStore with AsyncStorage adapter
    │
    ├── shared/
    │   ├── ui/
    │   │   ├── FilterPill.tsx
    │   │   ├── Badge.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── Skeleton.tsx
    │   │   ├── Toast.tsx
    │   │   ├── BottomSheet.tsx
    │   │   └── SearchBar.tsx
    │   └── components/
    │       ├── MediaCard.tsx
    │       ├── HeroSection.tsx
    │       └── CatalogRow.tsx
    │
    ├── features/
    │   ├── auth/
    │   │   ├── store.ts                    # ✅ Zustand + persist (SecureStore)
    │   │   ├── service.ts
    │   │   └── hooks.ts
    │   ├── home/
    │   │   ├── api.ts
    │   │   ├── store.ts
    │   │   └── components/
    │   │       ├── ContinueWatchingRow.tsx
    │   │       └── HomeRow.tsx
    │   ├── discover/
    │   │   ├── api.ts
    │   │   ├── store.ts
    │   │   └── components/
    │   │       ├── DiscoverGrid.tsx
    │   │       ├── FilterBar.tsx
    │   │       └── GenreSheet.tsx
    │   ├── library/
    │   │   ├── api.ts
    │   │   ├── store.ts
    │   │   └── components/
    │   │       ├── LibraryGrid.tsx
    │   │       └── SortSheet.tsx
    │   ├── downloads/
    │   │   ├── engine.ts                   # ✅ FileSystem.BACKGROUND session (Fix 1)
    │   │   ├── store.ts                    # ✅ Zustand + persist (SQLite adapter) (Fix 3)
    │   │   ├── realdebrid.ts              # ✅ Exponential backoff + rdQueue (Fix 4)
    │   │   ├── rdQueue.ts                  # ✅ p-queue concurrency lock (Fix 4)
    │   │   ├── notifications.ts
    │   │   └── components/
    │   │       ├── DownloadingList.tsx
    │   │       ├── CompletedList.tsx
    │   │       ├── DownloadItem.tsx
    │   │       └── DownloadConfirmSheet.tsx
    │   ├── addons/
    │   │   ├── parser.ts
    │   │   ├── store.ts
    │   │   └── components/
    │   │       ├── AddonList.tsx
    │   │       └── AddonCard.tsx
    │   ├── streams/
    │   │   ├── fetcher.ts
    │   │   └── components/
    │   │       ├── StreamList.tsx
    │   │       └── StreamItem.tsx
    │   ├── metadata/
    │   │   ├── cinemeta.ts
    │   │   └── types.ts
    │   ├── subtitles/
    │   │   ├── fetcher.ts
    │   │   ├── downloader.ts
    │   │   └── parser.ts
    │   ├── player/
    │   │   ├── store.ts
    │   │   ├── progress.ts
    │   │   └── components/
    │   │       ├── VLCWrapper.tsx
    │   │       ├── PlayerControls.tsx
    │   │       ├── SubtitlePicker.tsx
    │   │       ├── AudioPicker.tsx
    │   │       └── NextEpisodeOverlay.tsx
    │   └── settings/
    │       ├── service.ts
    │       └── components/
    │           ├── AccountSection.tsx
    │           ├── RealDebridSection.tsx
    │           ├── DownloadSection.tsx
    │           └── SubtitleSection.tsx
    │
    └── types/
        └── index.ts
```

---

## Database Schema (Drizzle + expo-sqlite)

```typescript
// src/core/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const downloads = sqliteTable('downloads', {
  id:              text('id').primaryKey(),
  imdbId:          text('imdb_id').notNull(),
  type:            text('type').notNull(),          // "movie" | "series"
  title:           text('title').notNull(),
  season:          integer('season'),
  episode:         integer('episode'),
  episodeTitle:    text('episode_title'),
  posterUrl:       text('poster_url'),
  streamName:      text('stream_name'),
  streamUrl:       text('stream_url').notNull(),
  directUrl:       text('direct_url'),
  localPath:       text('local_path'),
  fileSize:        integer('file_size'),
  quality:         text('quality'),
  addonId:         text('addon_id'),
  status:          text('status').notNull(),        // queued|downloading|paused|completed|failed
  progress:        real('progress').default(0),
  downloadedBytes: integer('downloaded_bytes').default(0),
  subtitlePath:    text('subtitle_path'),
  subtitleLang:    text('subtitle_lang'),
  createdAt:       integer('created_at').notNull(),
  completedAt:     integer('completed_at'),
});

export const watchProgress = sqliteTable('watch_progress', {
  id:          text('id').primaryKey(),
  imdbId:      text('imdb_id').notNull(),
  type:        text('type').notNull(),
  title:       text('title').notNull(),
  season:      integer('season'),
  episode:     integer('episode'),
  posterUrl:   text('poster_url'),
  positionMs:  integer('position_ms').default(0),
  durationMs:  integer('duration_ms').default(0),
  isOffline:   integer('is_offline').default(0),   // 0=false, 1=true
  updatedAt:   integer('updated_at').notNull(),
});
```

---

## Key TypeScript Interfaces

```typescript
// src/types/index.ts

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
  resources: string[];
  types: string[];
  catalogs: CatalogDefinition[];
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
  // Parsed locally:
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
```

---

# STEP-BY-STEP BUILD PLAN

> **For Qwen agent:** Complete each step fully. Do not proceed to the next step until the app compiles and runs. Steps are ordered by dependency — each step builds on the last.

---

## STEP 1 — Project Bootstrap (Updated for all 5 fixes)

### 1.1 Create project
```bash
npx create-expo-app@latest stremiox --template blank-typescript
cd stremiox
```

### 1.2 Install all dependencies
```bash
# Navigation
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar

# Stremio API
npm install stremio-api-client

# State (with persist middleware)
npm install zustand

# Storage
npx expo install @react-native-async-storage/async-storage expo-sqlite \
  expo-file-system expo-secure-store

# Database ORM (Fix 5)
npm install drizzle-orm
npm install -D drizzle-kit babel-plugin-inline-import

# Networking + RD queue (Fix 4)
npm install axios p-queue

# Video
npm install react-native-vlc-media-player

# Notifications (NO expo-background-fetch — Fix 1)
npx expo install expo-notifications

# UI
npx expo install expo-image expo-font expo-blur expo-linear-gradient @expo/vector-icons

# TypeScript
npm install -D typescript @types/react @types/react-native
```

### 1.3 Create metro.config.js (Fix 5 — Drizzle .sql support)
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('sql');
module.exports = config;
```

### 1.4 Update babel.config.js (Fix 5 — inline SQL imports)
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
```

### 1.5 Create plugins/withVLCPlayer.js (Fix 2 — VLC Config Plugin)
Implement the full plugin as shown in Fix 2 above.

### 1.6 Create plugins/withDownloadForegroundService.js (Fix 1 — Android foreground service)
Implement the full plugin as shown in Fix 1 above.

### 1.7 Configure app.json
```json
{
  "expo": {
    "name": "StremioX",
    "slug": "stremiox",
    "scheme": "stremiox",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "splash": { "backgroundColor": "#0d0d0d" },
    "ios": {
      "bundleIdentifier": "com.yourname.stremiox",
      "supportsTablet": true,
      "infoPlist": { "UIBackgroundModes": ["fetch", "processing"] }
    },
    "android": {
      "package": "com.yourname.stremiox",
      "permissions": [
        "INTERNET", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE",
        "FOREGROUND_SERVICE", "FOREGROUND_SERVICE_DATA_SYNC",
        "RECEIVE_BOOT_COMPLETED", "VIBRATE", "POST_NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      ["expo-notifications", { "icon": "./assets/icon.png", "color": "#7b2fff" }],
      "./plugins/withVLCPlayer",
      "./plugins/withDownloadForegroundService"
    ]
  }
}
```

### 1.8 Create drizzle.config.ts (Fix 5)
```typescript
import type { Config } from 'drizzle-kit';
export default {
  schema: './src/core/db/schema.ts',
  out: './src/core/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
```

### 1.9 Create src/core/db/schema.ts
Paste the full Drizzle schema from the Database Schema section above.

### 1.10 Create src/core/db/index.ts (Fix 5 — migration runner)
```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';

const expo = openDatabaseSync('stremiox.db', { enableChangeListener: true });
export const db = drizzle(expo, { schema });

export async function initDB(): Promise<void> {
  // Dynamically import migrations (generated by drizzle-kit)
  const migrations = require('./migrations/migrations');
  await migrate(db, migrations);
}
```

### 1.11 Generate initial migrations
```bash
npx drizzle-kit generate
```

### 1.12 Create src/core/theme/colors.ts + typography.ts
Paste the full color palette and typography constants.

### 1.13 Create src/types/index.ts
Paste all TypeScript interfaces from the section above.

### 1.14 Create src/core/api/axios.ts
```typescript
import axios from 'axios';

export const stremioAxios = axios.create({ baseURL: 'https://api.strem.io' });
export const cinemetaAxios = axios.create({ baseURL: 'https://v3-cinemeta.strem.io' });

// rdAxios — token injected via interceptor after auth
export const rdAxios = axios.create({ baseURL: 'https://api.real-debrid.com/rest/1.0' });

// Set RD API key after login:
export function setRDToken(apiKey: string) {
  rdAxios.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
}
```

### 1.15 Create src/core/api/stremio.ts
```typescript
import { StremioAPIStore } from 'stremio-api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = {
  getJSON: async (key: string) => {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  },
  setJSON: async (key: string, val: any) =>
    AsyncStorage.setItem(key, JSON.stringify(val)),
};

export const APIStore = new StremioAPIStore({ storage });
```

---

## STEP 2 — Auth Feature & Login Screen

### 2.1 Create src/features/auth/service.ts
```typescript
export async function loginStremio(email: string, password: string): Promise<StremioUser>
// Calls APIStore.login({ email, password })
// Then APIStore.pullAddonCollection()
// Returns APIStore.user

export async function clearSession(): Promise<void>
// Called on logout — Zustand persist will handle clearing SecureStore
```

### 2.2 Create src/features/auth/store.ts (Zustand + persist — Fix 3)
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Custom SecureStore adapter
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

interface AuthState {
  stremioUser: StremioUser | null;
  rdApiKey: string | null;
  login: (email: string, password: string, rdKey: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      stremioUser: null,
      rdApiKey: null,
      login: async (email, password, rdKey) => {
        const user = await loginStremio(email, password);
        setRDToken(rdKey);
        set({ stremioUser: user, rdApiKey: rdKey });
      },
      logout: () => set({ stremioUser: null, rdApiKey: null }),
    }),
    {
      name: 'stremiox-auth',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

### 2.3 Create src/features/auth/hooks.ts
```typescript
export function useRequireAuth() {
  const { stremioUser } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!stremioUser) router.replace('/(auth)/login');
  }, [stremioUser]);
}
```

### 2.4 Create app/(auth)/login.tsx
**UI layout:**
- Full-screen dark background (#0d0d0d)
- Top 35%: centered logo — purple circle with "S" glyph + "StremioX" bold white 28px + subtitle "Your Stremio. With Downloads." in secondary color
- Bottom 65%: form on dark navy card with rounded top (24px radius)
- Three inputs: Email, Password (show/hide toggle), Real-Debrid API Key
  - Dark input bg (#0d0d0d), purple border on focus, 12px radius, 52px height
  - RD field: small purple "?" link button → opens a modal explaining "Go to real-debrid.com/apitoken while logged in"
- "Sign In" purple button (full-width, 52px, 12px radius)
- Button shows spinner while loading, text otherwise
- Red error message below button on failure (e.g. "Incorrect email or password")
- On success → `router.replace('/(tabs)/')`

---

## STEP 3 — Tab Shell, Header & All Shared Components

### 3.1 Create app/(tabs)/_layout.tsx
Configure 5 tabs:

| Tab | File | Icon (active/inactive) | Badge |
|---|---|---|---|
| Home | index.tsx | home / home-outline | — |
| Discover | discover.tsx | compass / compass-outline | — |
| Library | library.tsx | library / library-outline | — |
| Downloads | downloads.tsx | download / download-outline | active count |
| Settings | settings.tsx | settings / settings-outline | — |

Tab bar style:
```typescript
tabBarStyle: { backgroundColor: '#0d0d0d', borderTopColor: '#2a2a3e', borderTopWidth: 1 },
tabBarActiveTintColor: '#7b2fff',
tabBarInactiveTintColor: '#a0a0b0',
```

Custom header for Home, Discover, Library tabs:
- Left: "StremioX" purple bold text
- Center: `SearchBar` component (tappable, navigates to `/search` on press, does not inline focus)
- Right: empty (or future profile icon)

Settings tab gets standard header with "Settings" title only.

### 3.2 Create src/shared/ui/SearchBar.tsx
Tappable dark pill input. Props: `onPress: () => void`. Renders: search icon + grey placeholder text "Search movies, shows..." Never accepts keyboard focus inline — the entire bar is one pressable element.

### 3.3 Create src/shared/ui/FilterPill.tsx
Dropdown pill component used in Discover, Library:
```typescript
Props: { label: string; options: string[]; value: string; onChange: (v: string) => void }
```
Style: dark pill (#1a1a2e), white text, chevron icon, 8px radius. Opens a small inline dropdown list or BottomSheet for long option lists.

### 3.4 Create src/shared/components/MediaCard.tsx
```typescript
Props: {
  item: LibraryItem;
  size?: 'sm' | 'md' | 'lg';         // sm=90x135, md=120x180, lg=160x240
  onPress: () => void;
  watchProgress?: number;             // 0–1, renders progress bar at bottom
  isDownloaded?: boolean;             // renders green badge bottom-right
  quality?: string;                   // renders quality badge top-right
}
```
- expo-image for poster with `contentFit="cover"`
- Gradient overlay (expo-linear-gradient) at bottom
- Title text bottom-left (white, bold, 2-line max)
- Optional thin purple ProgressBar at very bottom
- Optional green download circle badge bottom-right

### 3.5 Create src/shared/components/HeroSection.tsx
Full-width featured banner (device width × 300px):
- expo-image background with blurred tint
- expo-linear-gradient overlay (transparent → black, bottom 60%)
- Title (28px bold white), year · runtime · IMDb rating, genre pills
- Two buttons: "▶ Play" (white, filled) + "ⓘ More Info" (dark outline, purple border)
- Optional "Continue at {MM:SS}" purple pill badge if watchProgress exists

### 3.6 Create src/shared/components/CatalogRow.tsx
```typescript
Props: { title: string; items: LibraryItem[]; onItemPress: (item) => void; isLoading?: boolean; }
```
- Row title (bold white 16px) + "See all" link right
- Horizontal FlatList of MediaCards (size: md)
- When `isLoading`: render 5 Skeleton cards same size

### 3.7 Create src/shared/ui/Badge.tsx
Pill badge. Colors: 4K/UHD=`#f59e0b`, 1080p=`#7b2fff`, 720p=`#3b82f6`, HDR=`#22c55e`, RD=`#ff6b35`

### 3.8 Create src/shared/ui/ProgressBar.tsx
`Props: { progress: number; color?: string; height?: number; animated?: boolean }`
Thin bar with optional Animated value for smooth progress updates.

### 3.9 Create src/shared/ui/Skeleton.tsx
Rectangle shimmer using Animated API: cycles opacity from 0.3 → 0.8 → 0.3 (1.2s loop). Props: `width`, `height`, `borderRadius`.

### 3.10 Create src/shared/ui/Toast.tsx
Global toast manager. Anchored at bottom (96px from bottom). Auto-dismiss 3s. Types: `success` (green), `error` (red), `info` (purple). Slide-up animation on appear.

### 3.11 Create src/shared/ui/BottomSheet.tsx
Reusable bottom sheet using React Native's Modal + Animated. Props: `visible`, `onClose`, `children`, `title?`. Dark surface background (#1a1a2e), rounded top corners (20px), drag-to-close handle bar.

---

## STEP 4 — Add-on & Metadata Services

### 4.1 Create src/features/addons/parser.ts
```typescript
// Filter installed add-ons by resource
export function getAddonsByResource(resource: 'stream'|'catalog'|'subtitles'): AddonManifest[]

// Build stream URL for an item
export function buildStreamUrl(
  addon: AddonManifest, type: string, id: string,
  season?: number, episode?: number
): string
// movie: {transportUrl}/stream/movie/{imdbId}.json
// series: {transportUrl}/stream/series/{imdbId}:{season}:{episode}.json

// Build catalog URL
export function buildCatalogUrl(
  addon: AddonManifest, type: string, catalogId: string, extra?: Record<string,string>
): string
```

### 4.2 Create src/features/addons/store.ts (Zustand + persist)
```typescript
export const useAddonStore = create(
  persist(
    (set, get) => ({
      addons: [] as AddonManifest[],
      lastSynced: null as number | null,
      sync: async () => {
        await APIStore.pullAddonCollection();
        const addons = APIStore.addons?.addons || [];
        set({ addons, lastSynced: Date.now() });
      },
      getByResource: (resource: string) =>
        get().addons.filter(a => a.resources.includes(resource)),
    }),
    { name: 'stremiox-addons', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

### 4.3 Create src/features/metadata/cinemeta.ts
```typescript
// Single item metadata
export async function getMeta(type: 'movie'|'series', id: string): Promise<LibraryItem>
// GET https://v3-cinemeta.strem.io/meta/{type}/{id}.json → parse response.meta

// Single catalog page
export async function getCatalog(
  transportUrl: string, type: string, catalogId: string,
  extra?: Record<string, string>
): Promise<LibraryItem[]>
// GET {transportUrl}/catalog/{type}/{catalogId}/{extra as path params}.json

// Full search across all installed add-ons
export async function searchAll(query: string): Promise<LibraryItem[]>
// Get all addons with "search" in extra definitions
// Parallel fetch, flatten, deduplicate by id
```

---

## STEP 5 — Home Tab

### 5.1 Create src/features/home/api.ts
```typescript
export async function fetchContinueWatching(): Promise<WatchProgress[]>
// db.select().from(watchProgress)
//   .where(sql`position_ms > 0 AND CAST(position_ms AS REAL)/duration_ms < 0.95`)
//   .orderBy(desc(watchProgress.updatedAt))
//   .limit(15)

export async function fetchHomeRows(addons: AddonManifest[]): Promise<HomeRow[]>
// Take first 5 addons with catalogs
// Fetch their first catalog (type: movie or series)
// Return [{ title: string, items: LibraryItem[] }]
// Fail silently per add-on (if one fails, skip it)
```

### 5.2 Create src/features/home/store.ts (Zustand)
```typescript
interface HomeState {
  heroItem: LibraryItem | null;
  continueWatching: WatchProgress[];
  rows: HomeRow[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}
```
No persist needed here — data is always re-fetched.

### 5.3 Create src/features/home/components/ContinueWatchingRow.tsx
Horizontal row of continue watching cards. Each card:
- Medium MediaCard with `watchProgress` prop set
- Below poster: "S{n} E{n}" label for series
- Purple progress bar overlay at bottom of card

### 5.4 app/(tabs)/index.tsx
- On mount: call `homeStore.refresh()`
- Layout: vertical ScrollView, `refreshControl` for pull-to-refresh
- Sections: HeroSection → ContinueWatchingRow (if items exist) → CatalogRow × N
- Loading: full skeleton layout (hero shimmer block + row skeletons)
- On MediaCard press: `router.push('/detail/${item.type}/${item.id}')`

---

## STEP 6 — Discover Tab

### 6.1 Create src/features/discover/api.ts
```typescript
export async function fetchCatalog(params: {
  addonUrl: string; type: 'movie'|'series'; catalogId: string;
  genre?: string; sort?: string; skip?: number;
}): Promise<LibraryItem[]>

export async function fetchGenres(type: 'movie'|'series'): Promise<string[]>
// Fetch from Cinemeta catalog extra options
```

### 6.2 Create src/features/discover/store.ts (Zustand)
```typescript
interface DiscoverState {
  items: LibraryItem[];
  type: 'movie' | 'series';
  genre: string | null;
  activeCatalog: CatalogDefinition | null;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  setType: (type: 'movie'|'series') => void;
  setGenre: (genre: string|null) => void;
  setCatalog: (catalog: CatalogDefinition) => void;
  loadPage: () => Promise<void>;
  reset: () => void;
}
```

### 6.3 Create src/features/discover/components/FilterBar.tsx
Row of 3 FilterPills: Type ("Movies"|"Series"), Source (catalog names from add-ons), Genre.

### 6.4 Create src/features/discover/components/DiscoverGrid.tsx
FlatList with `numColumns={3}`, `onEndReachedThreshold={0.5}`, `onEndReached` triggers `loadPage()`. Footer: loading spinner when `hasMore`.

### 6.5 app/(tabs)/discover.tsx
- FilterBar at top (sticky via `stickyHeaderIndices`)
- DiscoverGrid below
- On filter change: call `discoverStore.reset()` then `loadPage()`

---

## STEP 7 — Library Tab

### 7.1 Create src/features/library/api.ts
```typescript
export async function fetchLibrary(authKey: string): Promise<LibraryItem[]>
// POST https://api.strem.io/api/datastoreGet
// body: { authKey, collection: 'libraryItem', ids: [], lastModified: null }
// Returns result array, filter out removed items (removed: true)
```

### 7.2 Create src/features/library/store.ts (Zustand + persist)
```typescript
export const useLibraryStore = create(
  persist(
    (set, get) => ({
      items: [] as LibraryItem[],
      typeFilter: 'all' as 'all'|'movie'|'series',
      sortBy: 'watched' as 'watched'|'name'|'year'|'rating',
      lastSynced: null as number | null,
      filteredItems: () => { /* compute from items + filters */ },
      sync: async (authKey: string) => { /* fetch + set items */ },
      setTypeFilter: (f: string) => set({ typeFilter: f }),
      setSortBy: (s: string) => set({ sortBy: s }),
    }),
    { name: 'stremiox-library', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

### 7.3 app/(tabs)/library.tsx
- FilterBar: type pill + sort pill + sync icon button in header
- 3-column FlatList of MediaCard (size: sm)
- Each card: offline badge if `downloads` store has completed entry, progress bar if watched
- Empty state: "Your Stremio library is empty."

---

## STEP 8 — Search Screen

### 8.1 app/search/index.tsx
- Presented as `fullScreenModal` (configured in root layout)
- Search input auto-focused on mount (keyboard opens immediately)
- Back button (←) left of input to dismiss
- Before searching: recent searches as tappable chips (stored in AsyncStorage, max 10)
- On type (debounce 400ms): call `searchAll(query)` from metadata service
- Results: 3-col MediaCard grid
- Loading: skeleton grid
- No results: "No results for '{query}'"
- Save to recent searches on result tap
- On card press: `router.push('/detail/${item.type}/${item.id}')`

---

## STEP 9 — Detail Screen

### 9.1 Create src/features/streams/fetcher.ts
```typescript
export async function getStreamsFromAllAddons(
  type: 'movie'|'series', imdbId: string,
  season?: number, episode?: number
): Promise<Stream[]>
```
Implementation:
1. `getAddonsByResource('stream')` → filter to those supporting the given `type`
2. Build URLs via `buildStreamUrl()` for each add-on
3. `Promise.allSettled()` — 10-second timeout per add-on (skip if slow)
4. Flatten all stream arrays
5. Parse quality from `name`/`title` (regex: `4K|2160p|1080p|720p|480p|360p`)
6. Parse `isRDCached`: `true` if name includes `⚡` or `[RD+` or `RD cache`
7. Sort: RD cached first, then by quality, then by source add-on
8. Deduplicate by `url || infoHash`

### 9.2 Create src/features/streams/components/StreamList.tsx
Scrollable grouped list (section per add-on). Each section header: add-on name (small, secondary color). Each stream: `StreamItem`. Shows loading spinner while streams are being fetched (streams arrive incrementally as each add-on responds).

### 9.3 Create src/features/streams/components/StreamItem.tsx
Single stream row:
- Left: quality badge + stream name/filename (1-line, truncated)
- Right: file size (if available from `behaviorHints.videoSize`) + add-on logo
- Bottom: "▶ Play" (purple) + "⬇ Download" (dark outline) buttons side by side

### 9.4 app/detail/[type]/[id].tsx
**Route params:** `type`, `id` (IMDB ID)

**On mount:** Fire both in parallel:
- `getMeta(type, id)` → populate metadata UI
- `getStreamsFromAllAddons(...)` → populate StreamList progressively

**Layout (ScrollView):**

**Hero block (top):**
- `ImageBackground` with dark overlay
- Poster (120x180) + title, year, rating, genres + description
- "▶ Play Best" button → plays the first RD-cached 1080p stream
- "⬇ Download" button → scrolls to stream list section

**Continue watching banner:** If `watchProgress` exists for this ID → purple "Resume from MM:SS ▶" bar below hero

**Series only — Episodes block:**
- Horizontal season pill selector
- Episode FlatList (vertical): episode number + title + thumbnail + ▶ Play + ⬇ Download inline

**Streams section:** `StreamList` component — live updates as each add-on responds

**Description (below streams):** Full plot, cast list (horizontal scroll), director

**Similar titles:** `CatalogRow` (fetched from Cinemeta)

---

## STEP 10 — Downloads Feature (Core Engine)

### 10.1 Create src/features/downloads/rdQueue.ts (Fix 4)
```typescript
import PQueue from 'p-queue';

// Max 2 simultaneous RD API operations
export const rdQueue = new PQueue({ concurrency: 2 });
```

### 10.2 Create src/features/downloads/realdebrid.ts (Fix 4 — backoff)
```typescript
// Verify API key
export async function getAccount(apiKey: string): Promise<RDAccount>
// GET /user → returns { username, premium, expiration }

// Unrestrict a direct URL
export async function unrestrictLink(url: string): Promise<string>
// POST /unrestrict/link { link: url } → { download: string }

// Add magnet + poll with exponential backoff
export async function magnetToDirectUrl(infoHash: string): Promise<string>
// 1. POST /torrents/addMagnet { magnet: "magnet:?xt=urn:btih:{infoHash}" }
// 2. POST /torrents/selectFiles/{id} { files: "all" }
// 3. pollTorrentUntilReady(id) — see backoff implementation below
// 4. POST /unrestrict/link with the first link
// 5. Return direct URL

// Exponential backoff polling
async function pollTorrentUntilReady(torrentId: string): Promise<string> {
  const delays = [3000, 5000, 8000, 13000, 21000, 34000];
  const MAX_WAIT_MS = 3 * 60 * 1000;
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < MAX_WAIT_MS) {
    const info = await rdAxios.get(`/torrents/info/${torrentId}`);
    if (info.data.status === 'downloaded') return info.data.links[0];
    if (['error', 'dead', 'magnet_error'].includes(info.data.status)) {
      throw new Error(`RD torrent failed: ${info.data.status}`);
    }
    const delay = delays[Math.min(attempt, delays.length - 1)];
    await new Promise(r => setTimeout(r, delay));
    attempt++;
  }
  throw new Error('RD torrent timed out after 3 minutes');
}

// Resolve any stream to a direct download URL
export async function resolveStreamUrl(stream: Stream): Promise<string>
// Uses rdQueue to enforce max 2 concurrent RD requests:
// return rdQueue.add(() =>
//   stream.url ? unrestrictLink(stream.url) : magnetToDirectUrl(stream.infoHash!)
// );
```

### 10.3 Create src/features/downloads/notifications.ts
```typescript
// Create Android notification channels on first launch
export async function setupNotificationChannels(): Promise<void>
// Channel 1: 'dl-progress' — LOW importance, silent, ongoing
// Channel 2: 'dl-complete' — HIGH importance, sound enabled

// Show/update ongoing download notification
export async function showProgressNotification(
  id: string, title: string, progress: number, speedKBps?: number
): Promise<void>

// Show completion notification
export async function showCompleteNotification(title: string): Promise<void>

// Show failure notification
export async function showFailureNotification(title: string, reason?: string): Promise<void>

// Dismiss an ongoing notification
export async function dismissNotification(id: string): Promise<void>
```

### 10.4 Create src/features/downloads/engine.ts (Fix 1 — BACKGROUND session)
```typescript
import * as FileSystem from 'expo-file-system';

const DOWNLOADS_DIR = FileSystem.documentDirectory + 'stremiox_downloads/';
const MAX_CONCURRENT = 2;

// Active resumable download instances (keyed by download ID)
const activeResumables: Record<string, FileSystem.DownloadResumable> = {};

export async function queueDownload(params: {
  stream: Stream;
  meta: LibraryItem;
  season?: number;
  episode?: number;
}): Promise<void>
// 1. Generate ID
// 2. Write to SQLite with status "queued"
// 3. Add to downloadStore
// 4. If activeCount < MAX_CONCURRENT → processDownload(id)
// else stays queued

export async function processDownload(downloadId: string): Promise<void>
// 1. Update status to "downloading" in SQLite + store
// 2. Resolve direct URL: await resolveStreamUrl(stream)
//    → wrapped via rdQueue (Fix 4)
// 3. Update directUrl in SQLite
// 4. Ensure directory exists: FileSystem.makeDirectoryAsync(DOWNLOADS_DIR + downloadId)
// 5. Set localPath = DOWNLOADS_DIR + downloadId + '/' + filename
// 6. Show progress notification
// 7. Create download with BACKGROUND session: ← KEY FIX
//    const resumable = FileSystem.createDownloadResumable(
//      directUrl,
//      localPath,
//      { sessionType: FileSystem.FileSystemSessionType.BACKGROUND },
//      (progress) => onProgress(downloadId, progress)
//    );
// 8. Store in activeResumables[downloadId]
// 9. await resumable.downloadAsync()
// 10. On success: update SQLite + store (completed, localPath, completedAt)
//     Show complete notification
//     Trigger subtitle download
//     Start next queued download
// 11. On error: update SQLite + store (failed)
//     Show failure notification

function onProgress(
  downloadId: string,
  progress: FileSystem.DownloadProgressData
): void
// Update SQLite progress + downloadStore every 500ms
// Calculate speed (bytes/s) for ETA display
// Update notification progress

export async function pauseDownload(downloadId: string): Promise<void>
// activeResumables[downloadId].pauseAsync()
// Save resumeData to SQLite
// Update status to "paused"

export async function resumeDownload(downloadId: string): Promise<void>
// Recreate DownloadResumable from saved resumeData
// Continue with BACKGROUND session
// Update status to "downloading"

export async function cancelDownload(downloadId: string): Promise<void>
// Cancel active resumable if exists
// Delete partial file
// Remove from SQLite
// Update store

export async function deleteDownload(downloadId: string): Promise<void>
// Delete FileSystem directory for this download
// Remove from SQLite
// Update store
// Start next queued download if any
```

### 10.5 Create src/features/downloads/store.ts (Zustand + SQLite persist — Fix 3)
```typescript
const sqliteStorage = {
  getItem: async (_key: string) => {
    const rows = await db.select().from(downloads).all();
    return JSON.stringify({ state: { downloads: Object.fromEntries(rows.map(r => [r.id, r])) } });
  },
  setItem: async (_key: string, _value: string) => {
    // SQLite writes happen in engine.ts directly — this is read-only for hydration
  },
  removeItem: async () => {},
};

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {} as Record<string, Download>,
      get activeCount() { return Object.values(get().downloads).filter(d => d.status === 'downloading').length; },
      get queue() { return Object.values(get().downloads).filter(d => d.status === 'queued').map(d => d.id); },
      addDownload: (d: Download) => set(s => ({ downloads: { ...s.downloads, [d.id]: d } })),
      updateDownload: (id, update) => set(s => ({
        downloads: { ...s.downloads, [id]: { ...s.downloads[id], ...update } }
      })),
      removeDownload: (id) => set(s => {
        const { [id]: _, ...rest } = s.downloads;
        return { downloads: rest };
      }),
      queueDownload: (params) => engine.queueDownload(params),
      pauseDownload: (id) => engine.pauseDownload(id),
      resumeDownload: (id) => engine.resumeDownload(id),
      cancelDownload: (id) => engine.cancelDownload(id),
      deleteDownload: (id) => engine.deleteDownload(id),
    }),
    { name: 'stremiox-downloads', storage: createJSONStorage(() => sqliteStorage) }
  )
);
```

### 10.6 Create src/features/downloads/components/DownloadConfirmSheet.tsx
BottomSheet with:
- Title, quality badge, file size estimate, source add-on name
- "Cancel" (ghost) + "⬇ Download" (purple) buttons
- On confirm: `downloadStore.queueDownload(params)`

### 10.7 Create src/features/downloads/components/DownloadItem.tsx
Single download row. Props: `download: Download`, `mode: 'active'|'completed'`

Active mode shows:
- Poster, title, episode info, quality badge
- Animated ProgressBar + "X.X / Y.Y MB · 75%"
- Speed: "↓ 4.2 MB/s · ~3 min left"
- Pause/Resume button + Cancel button

Completed mode shows:
- Poster, title, quality badge, file size
- "▶ Watch Offline" button (navigates to player with `isOffline: true`)
- Delete button
- Subtitle available badge (CC icon) if `subtitlePath` set

### 10.8 Create src/features/downloads/components/DownloadingList.tsx + CompletedList.tsx
Simple FlatLists of DownloadItem in respective modes. Empty state views.

### 10.9 app/(tabs)/downloads.tsx
Header: "Downloads" + storage usage right
Segmented control: "Downloading" | "Completed"
Render DownloadingList or CompletedList based on active segment.
Swipe-to-delete on completed items.

---

## STEP 11 — Subtitles Feature

### 11.1 Create src/features/subtitles/fetcher.ts
```typescript
export async function getSubtitles(
  type: 'movie'|'series', id: string,
  season?: number, episode?: number
): Promise<Subtitle[]>
// Get addons with 'subtitles' resource
// Build URL: {transportUrl}/subtitles/{type}/{id_string}.json
// Promise.allSettled, flatten, deduplicate by url
// Sort: English first, then alphabetical by langName
```

### 11.2 Create src/features/subtitles/downloader.ts
```typescript
export async function downloadSubtitle(
  subtitle: Subtitle, downloadId: string
): Promise<string>
// FileSystem.downloadAsync(
//   subtitle.url,
//   DOWNLOADS_DIR + downloadId + '/subtitle_' + subtitle.lang + '.srt'
// )
// Returns local path
```

### 11.3 Auto-subtitle integration in engine.ts
After `resumable.downloadAsync()` succeeds:
```typescript
try {
  const subs = await getSubtitles(type, imdbId, season, episode);
  const englishSub = subs.find(s => s.lang === 'eng') || subs[0];
  if (englishSub) {
    const subPath = await downloadSubtitle(englishSub, downloadId);
    await db.update(downloads).set({ subtitlePath: subPath, subtitleLang: englishSub.lang })
      .where(eq(downloads.id, downloadId));
  }
} catch {
  // Subtitle download failure is non-fatal — continue silently
}
```

---

## STEP 12 — Video Player

### 12.1 Create src/features/player/progress.ts
```typescript
export async function saveProgress(data: Omit<WatchProgress, 'updatedAt'>): Promise<void>
// db.insert(watchProgress).values({ ...data, updatedAt: Date.now() })
//   .onConflictDoUpdate({ target: watchProgress.id, set: { positionMs, durationMs, isOffline, updatedAt } })

export async function loadProgress(id: string): Promise<WatchProgress | null>
// db.select().from(watchProgress).where(eq(watchProgress.id, id)).get()

export async function markCompleted(id: string): Promise<void>
// Update positionMs = durationMs so item disappears from Continue Watching
```

### 12.2 Create src/features/player/store.ts (Zustand — no persist needed)
```typescript
interface PlayerState {
  positionMs: number;
  durationMs: number;
  isBuffering: boolean;
  setProgress: (pos: number, dur: number) => void;
  setBuffering: (v: boolean) => void;
}
```

### 12.3 Create src/features/player/components/VLCWrapper.tsx
```typescript
Props: {
  source: { uri: string };
  startPositionMs?: number;
  subtitleUri?: string;      // local file:/// path to .srt
  style?: ViewStyle;
  onProgress: (positionMs: number, durationMs: number) => void;
  onEnd: () => void;
  onError: (err: any) => void;
  onBuffer: (isBuffering: boolean) => void;
  ref: ForwardedRef<VLCPlayerRef>;  // expose play/pause/seek/setAudioTrack/setSubtitleTrack
}
```
Wraps `react-native-vlc-media-player`. Passes `initOptions: ['--network-caching=5000', '--file-caching=1000']` for buffering smoothness.

### 12.4 Create src/features/player/components/PlayerControls.tsx
Animated overlay (opacity 0 when hidden, 1 when shown). Auto-hide after 3s of no interaction.

Top bar: `← {title}` (pressing back saves progress + navigates back)

Center row: `|◀◀` (prev episode) · `⏸/▶` (60px) · `▶▶|` (next episode)
— prev/next only shown for series

Bottom row:
- Current time `MM:SS`
- Animated seek bar (purple filled track, white thumb, draggable) — full width
- Total duration `MM:SS`
- Right buttons: CC (subtitle), audio track (speaker icon)

Buffering overlay: centered `ActivityIndicator` over semi-transparent black bg

### 12.5 Create src/features/player/components/SubtitlePicker.tsx
BottomSheet. List of subtitle tracks available in VLC + "Off" at top. Active track shown with purple check. On tap: call VLCRef `setSubtitleTrack(id)`.

### 12.6 Create src/features/player/components/AudioPicker.tsx
BottomSheet. List of audio tracks. On tap: call VLCRef `setAudioTrack(id)`.

### 12.7 Create src/features/player/components/NextEpisodeOverlay.tsx
Slides up from bottom when `durationMs - positionMs < 30000` (30s left):
- "Next: S{n} E{n+1} — {title}" text
- Countdown progress bar (5s to auto-advance)
- "Play Next" button + "✕" dismiss button
- On auto-advance or Play Next: replace player source with next episode URL

### 12.8 app/player/[id].tsx
- Presented as `fullScreenModal` with `orientation: 'all'` (portrait + landscape)
- Status bar hidden
- On mount: call `loadProgress(id)` to get `startPositionMs`
- Determine URL: if `isOffline` → `localPath` else → stream `url`
- Render: `VLCWrapper` + `PlayerControls` overlay (tap to show/hide)
- `onProgress` (called by VLC every ~250ms):
  - Update playerStore
  - Every 5s: call `saveProgress()`
- `onEnd`: call `markCompleted(id)`
- On unmount: final `saveProgress()` call

---

## STEP 13 — Add-ons Screen

### 13.1 Create src/features/addons/components/AddonCard.tsx
Row with: add-on logo (expo-image, 40x40), name (bold), version, resource pills ("Streams", "Catalogs", "Subtitles"). Enabled/disabled toggle switch.

### 13.2 Create src/features/addons/components/AddonList.tsx
FlatList of AddonCard. Sections: "Active" and "Disabled".

### 13.3 app/addons/index.tsx
Header: "Installed Add-ons" + sync button (calls `addonStore.sync()`)
Body: AddonList
Empty state: "No add-ons installed. Open the Stremio app to install them."

---

## STEP 14 — Settings Tab

### 14.1 Create src/features/settings/service.ts
```typescript
export async function getTotalStorageUsed(): Promise<number>
// FileSystem.getInfoAsync(DOWNLOADS_DIR) → sum all file sizes

export async function deleteAllDownloads(): Promise<void>
// Loop downloads from SQLite → engine.deleteDownload(id) for each

export async function clearCache(): Promise<void>
// AsyncStorage.clear() for non-critical cached data
```

### 14.2 Create AccountSection, RealDebridSection, DownloadSection, SubtitleSection components
(Details described in previous version — see Step 14 of v2)

### 14.3 app/(tabs)/settings.tsx
ScrollView with grouped sections, each wrapped in a styled container (surface color, 12px radius).

---

## STEP 15 — Root Layout & App Entry

### 15.1 app/_layout.tsx (No manual hydration — Fix 3)
```typescript
export default function RootLayout() {
  const stremioUser = useAuthStore(s => s.stremioUser);
  const rdApiKey = useAuthStore(s => s.rdApiKey);
  const syncAddons = useAddonStore(s => s.sync);

  useEffect(() => {
    async function init() {
      await initDB();                      // Run Drizzle migrations
      await setupNotificationChannels();   // Android notification channels
      if (rdApiKey) setRDToken(rdApiKey);  // Restore RD token to axios
      if (stremioUser) syncAddons();       // Pull latest add-ons (non-blocking)
    }
    init();
  }, []);

  // Zustand persist middleware handles auth + downloads hydration automatically
  // No manual hydrate() calls needed here

  if (!stremioUser) return <Redirect href="/(auth)/login" />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0d0d0d' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="search/index" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="detail/[type]/[id]" />
        <Stack.Screen name="player/[id]" options={{ presentation: 'fullScreenModal', orientation: 'all' }} />
        <Stack.Screen name="addons/index" />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

---

## STEP 16 — End-to-End Flow Verification & Polish

### 16.1 Verify complete flows
1. **Login → Home:** Stremio + RD key → tabs load with catalog rows
2. **Online stream:** Home → Detail → StreamList → ▶ Play → VLC streams live
3. **Download flow:** Detail → ⬇ Download → DownloadConfirmSheet → Downloads tab (live progress, speed, ETA) → Complete notification → Watch Offline → VLC offline
4. **Continue watching:** Home → Continue Watching card → Player starts at saved position
5. **Series:** Detail → season selector → episode → ▶ Play → NextEpisodeOverlay → auto-advance
6. **Search:** Search bar → overlay → type → results → Detail
7. **Settings:** Verify RD key, view storage, delete downloads

### 16.2 Error handling (wrap all API calls)
- Login failure → red error below form
- Add-on stream timeout (>10s) → skip that add-on silently, show available streams
- RD unrestrict failure → Toast "Could not prepare stream. Check your RD key."
- RD polling timeout (3 min) → Toast "RD caching took too long. Try again later."
- VLC error → overlay "Playback failed. Try a different stream." with Retry button
- Network offline → Toast "You're offline" + show only local content

### 16.3 Offline mode (NetInfo integration)
```bash
npx expo install @react-native-community/netinfo
```
When offline:
- Home: only Continue Watching + completed Downloads rows
- Discover/Library: show stale cached data with "⚡ Offline — showing cached content" banner
- Search: disabled with overlay "Search requires an internet connection"
- Downloads tab: fully functional

---

## API Reference

| Service | Method | Endpoint |
|---|---|---|
| Stremio Login | POST | `https://api.strem.io/api/login` |
| Stremio Library | POST | `https://api.strem.io/api/datastoreGet` |
| Stremio Add-ons | POST | `https://api.strem.io/api/addonCollectionGet` |
| Cinemeta Meta | GET | `https://v3-cinemeta.strem.io/meta/{type}/{id}.json` |
| Cinemeta Catalog | GET | `https://v3-cinemeta.strem.io/catalog/{type}/{id}.json` |
| Add-on Streams | GET | `{transportUrl}/stream/{type}/{id}.json` |
| Add-on Catalog | GET | `{transportUrl}/catalog/{type}/{id}.json` |
| Add-on Subtitles | GET | `{transportUrl}/subtitles/{type}/{id}.json` |
| RD Account | GET | `https://api.real-debrid.com/rest/1.0/user` |
| RD Unrestrict | POST | `https://api.real-debrid.com/rest/1.0/unrestrict/link` |
| RD Add Magnet | POST | `https://api.real-debrid.com/rest/1.0/torrents/addMagnet` |
| RD Select Files | POST | `https://api.real-debrid.com/rest/1.0/torrents/selectFiles/{id}` |
| RD Torrent Info | GET | `https://api.real-debrid.com/rest/1.0/torrents/info/{id}` |

---

## Build Commands

```bash
npm install -g eas-cli
eas login
npx drizzle-kit generate              # Generate DB migrations after schema changes
eas build --profile development --platform android
eas build --profile development --platform ios
npx expo start --dev-client           # Run after installing the dev build on device
```

---

## Step Completion Checklist

- [ ] Step 1  — Project bootstrap: Expo, all deps, metro.config, babel.config, Config Plugins, Drizzle + migrations, theme, types
- [ ] Step 2  — Auth: service, Zustand persist store, login screen
- [ ] Step 3  — Tab shell: 5 tabs, custom search header, all shared components (SearchBar, MediaCard, HeroSection, CatalogRow, FilterPill, Badge, ProgressBar, Skeleton, Toast, BottomSheet)
- [ ] Step 4  — Add-on parser + store, Cinemeta metadata service
- [ ] Step 5  — Home tab: hero, continue watching, catalog rows
- [ ] Step 6  — Discover tab: filtered infinite scroll
- [ ] Step 7  — Library tab: Stremio sync + sort/filter
- [ ] Step 8  — Search screen: full-screen overlay + recent searches
- [ ] Step 9  — Detail screen: metadata, episodes, stream list (progressive)
- [ ] Step 10 — Downloads: RD (backoff + queue), engine (BACKGROUND session), store (persist), UI
- [ ] Step 11 — Subtitles: fetch, download, auto-attach to downloads
- [ ] Step 12 — Player: VLC wrapper, controls overlay, subtitle/audio pickers, next episode, position saving
- [ ] Step 13 — Add-ons screen (pushed from Settings)
- [ ] Step 14 — Settings tab: account, RD, downloads, subtitles
- [ ] Step 15 — Root layout: DB init, auth gate, no manual hydration
- [ ] Step 16 — End-to-end flow verification, error handling, offline mode