# StremioX - State Management

## State Management Approach

StremioX uses **Zustand** with the `persist` middleware for global state management.

### Benefits
- Lightweight - No provider wrapping needed
- Auto-hydration - State loaded before first render
- Custom storage - Different adapters for different data types
- Type-safe - Full TypeScript support

## Store Architecture

### Feature-Based Stores

```
src/features/
├── auth/store.ts          # Auth state (SecureStore)
├── home/store.ts          # Home state
├── discover/store.ts      # Discover state
├── library/store.ts       # Library state
├── downloads/store.ts     # Download state (SQLite)
├── addons/store.ts        # Add-on state
├── streams/store.ts       # Stream state
├── player/store.ts        # Player state
└── settings/store.ts      # Settings state
```

## Store Definitions

### Auth Store (SecureStore)

**Storage:** expo-secure-store (encrypted)
**Key:** stremiox-auth

```typescript
interface AuthState {
  user: StremioUser | null;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Download Store (SQLite)

**Storage:** SQLite via Drizzle ORM
**Key:** stremiox-downloads

```typescript
interface DownloadState {
  downloads: Download[];
  addDownload: (download) => Promise<void>;
  updateDownload: (id, updates) => Promise<void>;
  removeDownload: (id) => Promise<void>;
}
```

## State Hydration

**Key Decision:** No manual hydrate() calls in _layout.tsx

Zustand's `persist` middleware handles hydration automatically before the first render.

### Storage Adapters

| Store | Storage Adapter | Purpose |
|-------|----------------|---------|
| Auth | SecureStore | Encrypted auth tokens |
| Downloads | SQLite (Drizzle) | Structured download data |
| Home | AsyncStorage | Cached home data |
| Discover | AsyncStorage | Cached discover data |
| Library | AsyncStorage | Cached library data |

## State Updates

### Optimistic Updates

Updates are applied optimistically for better UX:

```typescript
const addDownload = async (download) => {
  // Optimistically add to state
  set((state) => ({ downloads: [...state.downloads, download] }));
  
  try {
    // Persist to database
    await db.insert(downloads).values(download);
  } catch (error) {
    // Rollback on failure
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== download.id),
    }));
    throw error;
  }
};
```

## State Selectors

Use selectors to avoid unnecessary re-renders:

```typescript
// Only re-renders when downloads change
const downloads = useDownloadStore((state) => state.downloads);

// Memoized selector
const downloadingItems = useDownloadStore(
  (state) => state.downloads.filter((d) => d.status === 'downloading')
);
```

## State Persistence Strategy

### What Gets Persisted

| Data Type | Storage |
|-----------|---------|
| Auth tokens | SecureStore |
| Download records | SQLite |
| Watch progress | SQLite |
| Add-on list | AsyncStorage |
| Cached metadata | AsyncStorage |
| UI preferences | AsyncStorage |

### What Stays in Memory

- Loading states
- Error states
- Temporary form data
