# StremioX - Project Overview

## Project Summary

**StremioX** is a React Native/Expo mobile application that serves as a Stremio client for iOS and Android devices. The application mirrors the official Stremio desktop app's UI (5-tab navigation, dark theme with black/purple color scheme) while adding offline viewing capabilities through Real-Debrid integration.

## Purpose

The app provides mobile users with:
- Full access to Stremio's streaming ecosystem via add-ons
- Offline viewing capability through Real-Debrid downloads
- A native mobile experience matching the desktop Stremio interface

## Key Features (Planned per stremiox-spec.md)

### Core Features
1. **5-Tab Navigation System**
   - Home - Continue watching and recommended content
   - Discover - Browse movies and series by genre
   - Library - User's saved content
   - Downloads - Offline content management (replaces Addons tab)
   - Settings - Account and add-on management

2. **Stremio Integration**
   - User authentication via `stremio-api-client`
   - Add-on installation and management
   - Stream fetching from all installed add-ons

3. **Real-Debrid Integration**
   - Torrent caching via Real-Debrid API
   - Direct URL resolution for unrestricted downloads
   - Background download support with OS-native download managers

4. **Offline Playback**
   - Local file storage via expo-file-system
   - VLC media player integration for MKV/multi-audio support
   - Download progress tracking and notifications

5. **Watch Progress Sync**
   - Local SQLite database via Drizzle ORM
   - Continue watching functionality
   - Position tracking for movies and series episodes

## Current Project State

**Status:** Early Bootstrap Phase

The project is currently in its initial setup phase with:
- Basic Expo project structure created
- Dependencies installed per the specification
- Core configuration files in place (app.json, tsconfig.json, eas.json)
- Detailed build specification document (stremiox-spec.md)

## Target Platforms

- **iOS:** iPhone and iPad (tablet support enabled)
- **Android:** Phones and tablets (minSdkVersion: 26)
- **Web:** Not a primary target (Expo web support available)

## Project Location

```
c:\Users\bhanu\Desktop\stremiox\stremiox\
```

## Key Configuration

- **Package Name (Android):** `com.bhanushekar2002.stremiox`
- **EAS Project ID:** `f2391a6e-5877-4ebc-aa31-5a30103d6982`
- **Expo SDK Version:** 55.0.0
- **React Version:** 19.2.4
- **React Native Version:** 0.83.2
