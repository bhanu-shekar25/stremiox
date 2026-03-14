import React from 'react';
import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { initDB } from '@/core/db';
import { setRDToken } from '@/core/api/axios';
import { colors } from '@/core/theme/colors';
import { useAuthStore } from '@/features/auth/store';
import { useAddonStore } from '@/features/addons/store';

export default function RootLayout() {
  const { isAuthenticated, rdApiKey, stremioUser } = useAuthStore();
  const syncAddons = useAddonStore((state) => state.sync);

  useEffect(() => {
    async function init() {
      try {
        // Initialize database (run migrations)
        await initDB();
        
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
      }
    }
    init();
  }, []);

  // Auth gate: redirect to login if not authenticated
  // Zustand persist handles hydration automatically before first render
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

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
          name="player/[id]"
          options={{ presentation: 'fullScreenModal', orientation: 'all' }}
        />
        <Stack.Screen name="addons/index" />
      </Stack>
      <StatusBar style="light" backgroundColor={colors.background} />
    </View>
  );
} 
