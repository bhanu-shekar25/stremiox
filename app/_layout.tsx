import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { initDB } from '@/core/db';
import { setRDToken } from '@/core/api/axios';
import { hydrateStremioCache } from '@/core/api/stremio';
import { hydrateAddonStore } from '@/features/addons/store';
import { colors } from '@/core/theme/colors';
import { useAuthStore } from '@/features/auth/store';
import { useAddonStore } from '@/features/addons/store';
import { useDownloadStore } from '@/features/downloads/store';

// Keep the splash screen visible while initializing
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  
  const { isAuthenticated, rdApiKey, stremioUser } = useAuthStore();
  const syncAddons = useAddonStore((state) => state.sync);
  
  // Navigation hooks for bulletproof auth routing
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        // 1. Initialize database (run migrations) FIRST
        await initDB();

        // 2. Hydrate Zustand SQLite store safely NOW that tables exist!
        await useDownloadStore.persist.rehydrate();

        // 3. Hydrate addon store with defaults + any stored addons
        await hydrateAddonStore();

        // 4. Hydrate Stremio API cache
        await hydrateStremioCache();

        // Setup notification channels for Android
        await Notifications.setNotificationChannelAsync('dl-progress', {
          name: 'Download Progress',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [],
          lightColor: colors.primary,
          sound: null,
        });
        await Notifications.setNotificationChannelAsync('dl-complete', {
          name: 'Download Complete',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: colors.success,
        });
        await Notifications.setNotificationChannelAsync('dl-failure', {
          name: 'Download Failed',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: colors.error,
        });

        // Restore RD token if exists
        if (rdApiKey) {
          setRDToken(rdApiKey);
        }

        // Sync add-ons if user is logged in (non-blocking)
        if (stremioUser) {
          syncAddons();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  // Auth Routing: Runs safely whenever auth state or segments change
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isReady, segments]);

  // Wait for initialization before rendering anything
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render the Stack normally. The useEffect above will handle pushing them to the login screen!
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen
          name="search/index"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="detail/[type]/[id]" />
        <Stack.Screen
          name="player"
          options={{ presentation: 'fullScreenModal', orientation: 'all' }}
        />
        <Stack.Screen name="addons/index" />
      </Stack>
      <StatusBar style="light" backgroundColor={colors.background} />
    </View>
  );
}
