# StremioX — End-to-End Flow Verification

## Step 16: Verification Checklist

---

## Core Flows

### 1. Login → Home Flow
- [ ] User enters email, password, and RD API key
- [ ] Login button shows spinner while loading
- [ ] On success, redirects to Home tab
- [ ] On failure, shows red error message below form
- [ ] Auth state persists across app restarts

**Files:** `app/(auth)/login.tsx`, `src/features/auth/store.ts`

---

### 2. Online Stream Flow
- [ ] Navigate to Home → tap media card → Detail screen
- [ ] Streams load from all installed add-ons
- [ ] Stream list shows quality badges and addon names
- [ ] "Play Best" button plays first RD-cached 1080p stream
- [ ] Player loads with correct stream URL
- [ ] Progress saves every 5 seconds

**Files:** `app/detail/[type]/[id].tsx`, `src/features/streams/fetcher.ts`, `app/player/[id].tsx`

---

### 3. Download Flow
- [ ] Detail screen → tap Download button
- [ ] Download confirm sheet shows with quality, size, addon
- [ ] Progress updates in real-time (speed, ETA, percentage)
- [ ] On complete: notification with sound
- [ ] "Watch Offline" button plays downloaded file
- [ ] Subtitle auto-downloads (English preferred)

**Files:** `src/features/downloads/engine.ts`, `app/(tabs)/downloads.tsx`

---

### 4. Continue Watching Flow
- [ ] Play content for 30+ seconds
- [ ] Return to Home tab
- [ ] "Continue Watching" row appears with item
- [ ] Progress bar shows on card
- [ ] Tap card → Player starts at saved position

**Files:** `app/(tabs)/index.tsx`, `src/features/player/progress.ts`

---

### 5. Series Flow
- [ ] Navigate to series detail
- [ ] Episode list shows with thumbnails
- [ ] Next episode overlay appears 30s before end
- [ ] Countdown progress bar (5s)
- [ ] Auto-advance or manual "Play Next"

**Files:** `app/detail/[type]/[id].tsx`, `src/features/player/components/NextEpisodeOverlay.tsx`

---

### 6. Search Flow
- [ ] Tap search bar in header
- [ ] Full-screen search overlay opens
- [ ] Recent searches show as chips
- [ ] Type query → results appear (debounced 400ms)
- [ ] Tap result → navigate to detail

**Files:** `app/search/index.tsx`

---

### 7. Settings Flow
- [ ] Account section shows email
- [ ] Real-Debrid section shows API key status
- [ ] Storage used displays correctly
- [ ] "Delete All Downloads" shows confirmation
- [ ] "Manage Add-ons" navigates to add-ons screen

**Files:** `app/(tabs)/settings.tsx`, `src/features/settings/`

---

## Error Handling

### Login Errors
- [ ] Invalid credentials → "Login failed. Please check your credentials."
- [ ] Network error → "Login failed. Please try again."

### Stream Errors
- [ ] Add-on timeout (>10s) → Skipped silently
- [ ] No streams → "No streams available" empty state
- [ ] RD unrestrict failure → Toast error

### Download Errors
- [ ] RD polling timeout (3 min) → Toast error
- [ ] Download failure → Status: "Failed"

### Player Errors
- [ ] VLC error → "Playback failed" message
- [ ] Offline playback → Uses localPath

---

## Offline Mode

### When Offline
- [ ] Home: Shows offline banner
- [ ] Home: Only Continue Watching + Downloads visible
- [ ] Discover: Shows cached data with banner
- [ ] Search: Disabled overlay
- [ ] Downloads: Fully functional

**Files:** `src/core/hooks/useOnlineStatus.ts`, `src/shared/ui/OfflineBanner.tsx`

---

## Build Commands

```bash
# Install NetInfo for offline mode
npx expo install @react-native-community/netinfo

# Generate DB migrations
npx drizzle-kit generate

# Start dev client
npx expo start --dev-client

# Build for testing
eas build --profile development --platform android
eas build --profile development --platform ios
```

---

*Last updated: Step 16 verification* 
