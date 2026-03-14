# StremioX - Entry Points & Navigation

## Application Entry Points

### Primary Entry Point

**File:** `c:\Users\bhanu\Desktop\stremiox\stremiox\index.ts`

```typescript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

**Purpose:**
- Registers the root component with Expo's AppRegistry
- Ensures consistent environment setup for Expo Go and native builds

### Current App Component

**File:** `c:\Users\bhanu\Desktop\stremiox\stremiox\App.tsx`

Currently a placeholder component that will be replaced by Expo Router's file-based routing system.

## Navigation Architecture

### Expo Router Structure (Planned)

```
app/
├── _layout.tsx                    # Root layout (providers, auth gate)
├── (auth)/
│   └── login.tsx                  # Login screen
├── (tabs)/
│   ├── _layout.tsx                # Tab bar layout
│   ├── index.tsx                  # Home tab (Tab 1)
│   ├── discover.tsx               # Discover tab (Tab 2)
│   ├── library.tsx                # Library tab (Tab 3)
│   ├── downloads.tsx              # Downloads tab (Tab 4)
│   └── settings.tsx               # Settings tab (Tab 5)
├── search/
│   └── index.tsx                  # Full-screen search overlay
├── detail/
│   └── [type]/
│       └── [id].tsx               # Media detail (dynamic route)
├── player/
│   └── [id].tsx                   # Video player (dynamic route)
└── addons/
    └── index.tsx                  # Add-on management
```

## Route Definitions

### Root Layout (app/_layout.tsx)

**Responsibilities:**
- Initialize providers (Zustand stores, theme)
- Load fonts
- Initialize database (Drizzle migrations)
- Auth gate (redirect to login if not authenticated)

### Tab Navigation (app/(tabs)/_layout.tsx)

**5 Tabs:**
| Tab | Route | Description |
|-----|-------|-------------|
| Home | index.tsx | Continue watching, recommendations |
| Discover | discover.tsx | Browse by genre |
| Library | library.tsx | Saved content |
| Downloads | downloads.tsx | Offline content |
| Settings | settings.tsx | Account, add-ons |

### Media Detail (app/detail/[type]/[id].tsx)

**Dynamic Route Parameters:**
- type: "movie" or "series"
- id: IMDb ID or Stremio meta ID

### Video Player (app/player/[id].tsx)

**Dynamic Route Parameters:**
- id: Download ID or stream ID

## Navigation Patterns

### Programmatic Navigation

```typescript
import { router } from 'expo-router';

// Navigate to detail screen
router.push(`/detail/movie/tt1234567`);

// Navigate to player
router.push(`/player/download-123`);

// Go back
router.back();
```

### Deep Linking

**Scheme:** `stremiox://`

**Supported Links:**
- `stremiox://detail/movie/tt1234567` - Open movie detail
- `stremiox://detail/series/tt1234567` - Open series detail
- `stremiox://player/123` - Open player

## File-Based Routing Conventions

| File Pattern | Route | Description |
|--------------|-------|-------------|
| index.tsx | / | Root of segment |
| [param].tsx | /:param | Dynamic parameter |
| (group) | (no URL segment) | Route group (layout only) |
| _layout.tsx | (layout) | Layout wrapper |
