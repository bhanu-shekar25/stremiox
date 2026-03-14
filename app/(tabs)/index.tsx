import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useHomeStore } from '@/features/home/store';
import { useAddonStore } from '@/features/addons/store';
import { HeroSection } from '@/shared/components/HeroSection';
import { CatalogRow } from '@/shared/components/CatalogRow';
import { ContinueWatchingRow } from '@/features/home/components/ContinueWatchingRow';
import { Skeleton } from '@/shared/ui/Skeleton';
import { colors } from '@/core/theme/colors';
import type { LibraryItem } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { heroItem, continueWatching, rows, isLoading, isRefreshing, refresh } = useHomeStore();
  const { sync, addons } = useAddonStore();

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      // Sync addons first if not already loaded
      if (addons.length === 0) {
        await sync();
      }
      // Then refresh home data
      await refresh();
    };
    loadData();
  }, []);

  const handleItemPress = (item: LibraryItem) => {
    router.push(`/detail/${item.type}/${item.id}`);
  };

  const handleHeroPlay = () => {
    if (heroItem) {
      router.push(`/detail/${heroItem.type}/${heroItem.id}`);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Hero Section */}
      {isLoading || !heroItem ? (
        <View style={styles.heroSkeleton}>
          <Skeleton width={400} height={300} borderRadius={0} />
        </View>
      ) : (
        <HeroSection
          item={heroItem}
          onPlay={handleHeroPlay}
          onMoreInfo={handleHeroPlay}
        />
      )}

      {/* Continue Watching */}
      {isLoading ? (
        <View style={styles.rowSkeleton}>
          <Skeleton width={150} height={24} borderRadius={8} />
          <View style={styles.skeletonRow}>
            <Skeleton width={120} height={180} borderRadius={8} />
            <Skeleton width={120} height={180} borderRadius={8} />
            <Skeleton width={120} height={180} borderRadius={8} />
          </View>
        </View>
      ) : continueWatching.length > 0 ? (
        <ContinueWatchingRow items={continueWatching} />
      ) : null}

      {/* Catalog Rows */}
      {isLoading
        ? // Show skeleton rows
          Array(3)
            .fill(null)
            .map((_, i) => (
              <View key={i} style={styles.rowSkeleton}>
                <Skeleton width={150} height={24} borderRadius={8} />
                <View style={styles.skeletonRow}>
                  <Skeleton width={120} height={180} borderRadius={8} />
                  <Skeleton width={120} height={180} borderRadius={8} />
                  <Skeleton width={120} height={180} borderRadius={8} />
                </View>
              </View>
            ))
        : // Show actual rows
          rows.map((row, index) => (
            <CatalogRow
              key={`${row.addonId}-${index}`}
              title={row.title}
              items={row.items}
              onItemPress={handleItemPress}
            />
          ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSkeleton: {
    width: '100%',
    height: 300,
  },
  rowSkeleton: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  bottomPadding: {
    height: 20,
  },
});
