# StremioX - Technology Stack

## Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.83.2 | Native UI rendering |
| React | 19.2.4 | Component framework |
| Expo SDK | ~55.0.6 | Native abstraction & tooling |
| TypeScript | ~5.9.2 | Type safety |

## Navigation & Routing

| Package | Version | Purpose |
|---------|---------|---------|
| expo-router | ~55.0.5 | File-based routing |
| react-native-screens | ~4.23.0 | Native screen components |
| react-native-safe-area-context | ~5.6.2 | Safe area handling |
| expo-linking | ~55.0.7 | Deep linking support |
| expo-constants | ~55.0.7 | App constants access |
| expo-status-bar | ~55.0.4 | Status bar control |

## State Management

| Package | Version | Purpose |
|---------|---------|---------|
| zustand | ^5.0.11 | Global state management |
| zustand/persist | (included) | State persistence middleware |

## Data & Storage

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.45.1 | ORM for SQLite |
| expo-sqlite | ~55.0.10 | SQLite database |
| @react-native-async-storage/async-storage | ^2.2.0 | Key-value storage |
| expo-secure-store | ~55.0.8 | Encrypted secure storage |
| expo-file-system | ~55.0.10 | File system access |

## Networking & APIs

| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.13.6 | HTTP client |
| stremio-api-client | ^1.6.0 | Stremio API wrapper |
| p-queue | ^9.1.0 | API request queue/concurrency |

## Media & Playback

| Package | Version | Purpose |
|---------|---------|---------|
| react-native-vlc-media-player | ^1.0.98 | Video playback (MKV support) |
| expo-image | ~55.0.6 | Cached image loading |
| expo-linear-gradient | ~55.0.8 | Gradient backgrounds |
| expo-blur | ~55.0.9 | Blur effects |

## Notifications

| Package | Version | Purpose |
|---------|---------|---------|
| expo-notifications | ~55.0.12 | Push & local notifications |

## UI & Icons

| Package | Version | Purpose |
|---------|---------|---------|
| @expo/vector-icons | ^15.1.1 | Icon library (Ionicons) |
| expo-font | ~55.0.4 | Custom font loading |

## Build & Configuration

| Package | Version | Purpose |
|---------|---------|---------|
| expo-build-properties | ^55.0.9 | Native build config |
| expo-dev-client | ~55.0.16 | Development client |

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-kit | ^0.31.9 | Drizzle migrations |
| babel-plugin-inline-import | ^3.0.0 | Inline SQL imports |
| @types/react | ~19.2.2 | React type definitions |
| @types/react-native | ^0.72.8 | React Native type definitions |

## External Services

| Service | Purpose |
|---------|---------|
| Stremio API | User auth, add-on management |
| Cinemeta | Movie/series metadata |
| Real-Debrid | Torrent caching, unrestricted downloads |

## Notable Exclusions

| Package | Reason for Exclusion |
|---------|---------------------|
| expo-background-fetch | Wrong tool for background downloads |
| expo-task-manager | Not needed with FileSystem.BACKGROUND |
| Redux | Zustand is lighter and sufficient |

## Package.json Scripts

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```
