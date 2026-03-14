# StremioX - Architecture Documentation

## Architectural Pattern

The application follows a **Feature-First Modular Architecture** with clear separation of concerns.

## Directory Structure (Planned)

```
stremiox/
├── app/                          # Expo Router - Views only (no logic)
│   ├── _layout.tsx               # Root layout with providers
│   ├── (auth)/login.tsx          # Authentication screen
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Home tab
│   │   ├── discover.tsx          # Discover tab
│   │   ├── library.tsx           # Library tab
│   │   ├── downloads.tsx         # Downloads tab
│   │   └── settings.tsx          # Settings tab
│   ├── detail/[type]/[id].tsx    # Media detail screens
│   ├── player/[id].tsx           # Video player screen
│   └── addons/index.tsx          # Add-on management
│
├── plugins/                      # Expo Config Plugins (native mods)
│   ├── withVLCPlayer.js          # VLC native linking
│   └── withDownloadForegroundService.js  # Android foreground service
│
└── src/
    ├── core/                     # Shared infrastructure
    │   ├── db/                   # Database (Drizzle + SQLite)
    │   ├── theme/                # Colors, typography
    │   └── api/                  # API clients (axios, stremio)
    │
    ├── shared/                   # Cross-feature components
    │   ├── ui/                   # Primitive UI components
    │   └── components/           # Composite components
    │
    ├── features/                 # Feature modules
    │   ├── auth/                 # Authentication
    │   ├── home/                 # Home screen
    │   ├── discover/             # Discover screen
    │   ├── library/              # Library screen
    │   ├── downloads/            # Downloads (Real-Debrid)
    │   ├── addons/               # Add-on management
    │   ├── streams/              # Stream fetching
    │   ├── metadata/             # Cinemeta API
    │   ├── subtitles/            # Subtitle handling
    │   ├── player/               # VLC player wrapper
    │   └── settings/             # Settings screen
    │
    └── types/                    # TypeScript definitions
```

## Component Architecture

### View Components (app/)
- Thin shells - Only contain navigation logic and component composition
- No business logic - All logic delegated to feature hooks/services
- Expo Router - File-based routing with dynamic segments

### Feature Components (src/features/*/components/)
- Feature-scoped - Components specific to a feature domain
- Composable - Built from shared UI primitives
- Hook-driven - Use feature-specific hooks for state/data

### Shared UI Components (src/shared/ui/)
- Primitive components - Button, Input, Card, etc.
- Theme-aware - Use colors/typography from core/theme
- No feature dependencies - Pure presentational components

## Data Flow

```
User Action -> Component (app/) -> Hook (feature) -> Store (Zustand)
                                                      |
                                              Service (domain)
                                                      |
                                               External API
                                                      |
                                               SQLite (Local)
```

## Key Architectural Decisions

1. **Expo Router for Navigation** - File-based routing, deep linking support
2. **Zustand for State Management** - Lightweight, persist middleware
3. **Drizzle ORM for Local Database** - Type-safe SQL, migration support
4. **Feature-First Organization** - Self-contained features
5. **Background Downloads via OS Native Managers** - FileSystem.BACKGROUND session

## Native Module Integration

### Config Plugins Required

| Plugin | Purpose | Platform |
|--------|---------|----------|
| withVLCPlayer.js | VLC native linking, bitcode disable | iOS + Android |
| withDownloadForegroundService.js | Android foreground service | Android |

## Build Configuration

### EAS Build Profiles

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| development | Dev client builds | Internal |
| preview | Preview builds | Internal |
| production | Production releases | App Store / Play Store |
