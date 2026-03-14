# StremioX — Project Definition

## Project Summary

**StremioX** is a React Native/Expo mobile application that brings the Stremio streaming ecosystem to iOS and Android with offline viewing capabilities. The app mirrors the official Stremio desktop UI (5-tab navigation, dark theme with black/purple color scheme) while adding Real-Debrid integration for torrent caching and local downloads.

## Purpose

The app provides mobile users with:
- Full access to Stremio's streaming ecosystem via add-ons
- Offline viewing capability through Real-Debrid downloads
- A native mobile experience matching the desktop Stremio interface
- Watch progress sync across devices

---

## Requirements

### Validated

(None yet — project is in early bootstrap phase, codebase mapped but no features implemented)

### Active

#### Authentication & Account
- [ ] Stremio authentication via `stremio-api-client` (email/password login)
- [ ] Real-Debrid API key input and validation
- [ ] Secure credential storage via expo-secure-store with Zustand persist middleware
- [ ] Session persistence across app restarts

#### Navigation & UI Shell
- [ ] 5-tab navigation: Home, Discover, Library, Downloads, Settings
- [ ] Custom header with global search bar on Home/Discover/Library tabs
- [ ] Dark theme implementation (#0d0d0d background, #1a1a2e surface, #7b2fff primary)
- [ ] Full-screen search overlay with recent searches
- [ ] Detail screen for movies/series with stream selection
- [ ] Full-screen video player with landscape support

#### Content Discovery
- [ ] Home tab: Hero section, Continue Watching row, catalog rows from add-ons
- [ ] Discover tab: Infinite scroll grid with Type/Source/Genre filters
- [ ] Library tab: Stremio library sync with sort/filter options
- [ ] Search across all installed add-ons with debounced results
- [ ] Progressive stream loading (add-ons respond incrementally)

#### Add-on System
- [ ] Add-on parser for stream/catalog/subtitle resources
- [ ] Add-on store with Zustand persist (AsyncStorage)
- [ ] Add-on manager screen with enable/disable toggle
- [ ] Stream URL builder for movie/series types
- [ ] Catalog fetching from multiple add-ons

#### Downloads (Core Feature)
- [ ] Download engine using `FileSystem.BACKGROUND` session (OS-native download manager)
- [ ] Android foreground service for background downloads (custom Expo Config Plugin)
- [ ] Real-Debrid integration: magnet-to-direct resolution with exponential backoff
- [ ] P-queue concurrency lock (max 2 simultaneous RD API calls)
- [ ] Download states: queued, downloading, paused, completed, failed
- [ ] Pause/resume/cancel functionality with resume data persistence
- [ ] Progress notifications with speed/ETA display
- [ ] Completion notifications with sound
- [ ] Storage management (view usage, delete downloads)

#### Video Playback
- [ ] VLC media player wrapper (react-native-vlc-media-player)
- [ ] Custom Expo Config Plugin for VLC native linking
- [ ] MKV file support with multi-audio track selection
- [ ] Subtitle support (.srt files) with language picker
- [ ] Watch progress tracking (save every 5s, load on play)
- [ ] Continue Watching functionality
- [ ] Next episode auto-advance overlay for series
- [ ] Player controls: seek, play/pause, episode navigation
- [ ] Buffering handling with 5s network caching

#### Subtitles
- [ ] Subtitle fetching from add-ons with 'subtitles' resource
- [ ] Auto-download English subtitles for completed downloads
- [ ] Manual subtitle picker during playback
- [ ] Subtitle track switching in VLC

#### Data & State
- [ ] Drizzle ORM with expo-sqlite for local database
- [ ] Metro config for .sql migration file bundling
- [ ] Babel plugin for inline SQL imports
- [ ] Database tables: downloads, watchProgress
- [ ] Zustand stores with persist middleware (auto-hydration, no manual hydrate calls)
- [ ] Storage adapters: SecureStore (auth), SQLite (downloads), AsyncStorage (addons/library)

#### Offline Mode
- [ ] NetInfo integration for connectivity detection
- [ ] Offline banner showing cached content
- [ ] Offline playback of downloaded content
- [ ] Graceful degradation when offline (disable search, show cached data)

#### Error Handling
- [ ] Login failure with user-friendly messages
- [ ] Add-on timeout handling (10s per add-on, skip silently)
- [ ] RD unrestrict failure with retry option
- [ ] RD polling timeout (3 min max wait)
- [ ] VLC playback errors with retry option
- [ ] Toast notifications for all error states

### Out of Scope

- **Web platform** — Not a primary target; Expo web support available but not optimized
- **expo-background-fetch** — Removed from stack; uses FileSystem.BACKGROUND session instead
- **Manual Zustand hydration** — Replaced with persist middleware auto-hydration
- **Aggressive RD polling** — Replaced with exponential backoff (3s, 5s, 8s, 13s, 21s)
- **Unlimited RD concurrency** — Limited to 2 concurrent API calls via p-queue

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use FileSystem.BACKGROUND session instead of expo-background-fetch | expo-background-fetch is for lightweight polling, not sustained downloads; OS will kill app-owned background tasks | Downloads handed off to native OS download managers (NSURLSession/DownloadManager) |
| Custom Expo Config Plugins for VLC and Android foreground service | react-native-vlc-mediaplayer requires native linking; Android requires foreground service for large downloads | plugins/withVLCPlayer.js and plugins/withDownloadForegroundService.js created |
| Zustand persist middleware over manual hydrate() calls | Manual hydration in useEffect creates timing issues, screen flicker, race conditions | Auto-hydration before first render with custom storage adapters |
| Exponential backoff for RD torrent polling | Aggressive 3s polling can trigger rate limits or temporary IP bans | Fibonacci-ish delays: 3s, 5s, 8s, 13s, 21s with 3-minute timeout |
| P-queue for RD API concurrency | Multiple simultaneous downloads firing RD requests at once can trigger rate limits | Max 2 concurrent RD API operations |
| Drizzle ORM + expo-sqlite over raw SQLite | Type-safe queries, schema management, migration generation | Metro config + babel plugin for .sql file bundling |
| Feature-first architecture over layer-first | Better code organization, easier to navigate, feature encapsulation | src/features/{auth,home,discover,library,downloads,player,addons,settings}/ |
| expo-router for file-based routing | Expo's recommended routing solution, matches React Router mental model | app/ directory structure with (tabs), (auth), detail, player routes |

---

## Technical Constraints

### Platform Requirements
- **iOS:** iPhone and iPad (tablet support enabled), min iOS 13
- **Android:** Phones and tablets, minSdkVersion 26 (Android 8.0)
- **EAS Build:** Required for native modules (VLC, foreground service)

### Critical Architecture Constraints
1. **NO expo-background-fetch** — Must use FileSystem.BACKGROUND session
2. **VLC requires Config Plugin** — Native linking via withVLCPlayer.js
3. **Android foreground service mandatory** — withDownloadForegroundService.js for download notifications
4. **Zustand persist only** — No manual hydrate() calls in _layout.tsx
5. **RD exponential backoff** — Max 3-minute wait, fibonacci delays
6. **RD concurrency lock** — Max 2 simultaneous API calls
7. **Metro .sql support** — assetExts.push('sql') required
8. **Babel inline import** — babel-plugin-inline-import for migrations

### External Dependencies
- **Stremio API** — Authentication, add-on collection, library sync
- **Cinemeta API** — Metadata for movies/series (v3-cinemeta.strem.io)
- **Real-Debrid API** — Torrent caching, link unrestricting
- **Add-on Protocol** — Decentralized add-on system (user-installed)

### Performance Constraints
- Stream fetching: 10-second timeout per add-on
- RD torrent polling: 3-minute max wait
- Download concurrency: Max 2 simultaneous downloads
- RD API concurrency: Max 2 simultaneous calls
- Search debounce: 400ms
- Progress save interval: 5 seconds
- Notification update interval: 500ms

---

## Project State

**Status:** Early Bootstrap Phase

The project has:
- ✅ Basic Expo project structure created
- ✅ All dependencies installed per specification
- ✅ Core configuration files in place (app.json, tsconfig.json, eas.json)
- ✅ Comprehensive 1787-line build specification (stremiox-spec.md)
- ✅ Codebase map created in .planning/codebase/ (7 documents)

The app is currently a minimal placeholder (default Expo template). No features have been implemented yet.

---

## Architecture Overview

### Directory Structure
```
stremiox/
├── app/                          # Expo Router (routing & view shells only)
│   ├── _layout.tsx               # Root: providers, fonts, auth gate, DB init
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Home
│   │   ├── discover.tsx
│   │   ├── library.tsx
│   │   ├── downloads.tsx
│   │   └── settings.tsx
│   ├── search/
│   │   └── index.tsx
│   ├── detail/
│   │   └── [type]/[id].tsx
│   ├── player/
│   │   └── [id].tsx
│   └── addons/
│       └── index.tsx
├── plugins/                      # Expo Config Plugins
│   ├── withVLCPlayer.js
│   └── withDownloadForegroundService.js
└── src/
    ├── core/                     # Shared infrastructure
    │   ├── db/                   # Drizzle schema, migrations, init
    │   ├── theme/                # Colors, typography
    │   └── api/                  # Axios instances, Stremio API store
    ├── shared/                   # Reusable UI components
    │   ├── ui/                   # FilterPill, Badge, ProgressBar, etc.
    │   └── components/           # MediaCard, HeroSection, CatalogRow
    ├── features/                 # Feature modules (feature-first architecture)
    │   ├── auth/
    │   ├── home/
    │   ├── discover/
    │   ├── library/
    │   ├── downloads/            # engine.ts, realdebrid.ts, rdQueue.ts
    │   ├── addons/
    │   ├── streams/
    │   ├── metadata/
    │   ├── subtitles/
    │   ├── player/
    │   └── settings/
    └── types/                    # TypeScript interfaces
```

### State Management
- **Zustand** with persist middleware for all feature stores
- **Custom storage adapters:**
  - SecureStore: Auth store (stremioUser, rdApiKey)
  - SQLite: Downloads store (via Drizzle)
  - AsyncStorage: Add-ons, library, settings

### Data Flow
1. **Read:** Zustand persist auto-hydrates on app start → screens render with persisted data
2. **Write:** Actions update Zustand → persist middleware saves to storage → screens re-render
3. **Sync:** Background sync for add-ons, library (non-blocking)

---

## Success Criteria

### Functional
- User can log in with Stremio credentials + Real-Debrid API key
- User can browse content from all installed add-ons
- User can initiate downloads that continue in background (app can be killed)
- User can watch downloaded content offline via VLC player
- User's watch progress syncs across sessions
- User can search across all add-ons

### Technical
- EAS build succeeds for both iOS and Android
- No manual hydrate() calls in _layout.tsx
- All downloads use FileSystem.BACKGROUND session
- RD API calls respect exponential backoff and concurrency limits
- Drizzle migrations run successfully on first launch
- VLC player configured via Config Plugin (no EAS build failures)

### UX
- App matches Stremio desktop UI (dark theme, purple accents)
- Downloads show live progress, speed, ETA
- Smooth 60fps scrolling in catalog rows
- Graceful offline mode with cached content
- Error messages are user-friendly and actionable

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Real-Debrid API rate limiting | High | Exponential backoff, p-queue concurrency lock |
| Android killing background downloads | High | Foreground service with persistent notification |
| iOS killing background downloads | High | FileSystem.BACKGROUND session (OS-owned download) |
| VLC native linking failures | Medium | Custom Config Plugin with bitcode disable |
| Drizzle .sql migration bundling failures | Medium | Metro config assetExts + babel-plugin-inline-import |
| Add-on timeout causing empty streams | Low | 10s timeout per add-on, progressive rendering |
| Zustand hydration race conditions | Low | persist middleware with auto-hydration (no manual calls) |

---

## Open Questions

1. **Tablet optimization level** — Will the app use split views on iPad or just scaled phone UI?
2. **Casting support** — Should Chromecast/AirPlay be added in a future iteration?
3. **Trakt integration** — Should watch progress sync to Trakt for cross-platform tracking?
4. **Download quality limits** — Should users be able to set max quality for downloads (e.g., 1080p max to save space)?
5. **Wi-Fi only downloads** — Should downloads be restricted to Wi-Fi by default?

---

## References

- **Build Specification:** `stremiox-spec.md` (1787 lines, complete step-by-step plan)
- **Codebase Map:** `.planning/codebase/` (7 documents: OVERVIEW, ARCHITECTURE, STACK, DOMAIN, ENTRYPOINTS, STATE, INTERFACES)
- **Stremio API:** https://github.com/Stremio/stremio-api-nodejs
- **Real-Debrid API:** https://api.real-debrid.com/
- **Expo Router:** https://expo.github.io/router/docs/
- **Zustand persist:** https://github.com/pmndrs/zustand#persist-middleware
- **Drizzle ORM:** https://orm.drizzle.team/docs/overview

---

*Last updated: 14 March 2026 after initialization with codebase mapping complete*