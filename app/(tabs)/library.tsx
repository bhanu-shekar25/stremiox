import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibraryStore } from '@/features/library/store';
import { useAuthStore } from '@/features/auth/store';
import { LibraryFilterBar } from '@/features/library/components/LibraryFilterBar';
import { MediaCard } from '@/shared/components/MediaCard';
import { Skeleton } from '@/shared/ui/Skeleton';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import type { LibraryItem } from '@/types';

export default function LibraryScreen() {
  const router = useRouter();
  const { stremioUser } = useAuthStore();
  const { items, isLoading, isSyncing, filteredItems, sync, setTypeFilter } = useLibraryStore();

  // Initial sync
  useEffect(() => {
    const loadData = async () => {
      if (stremioUser?.authKey) {
        await sync(stremioUser.authKey);
      }
    };
    loadData();
  }, []);

  const handleSync = async () => {
    if (stremioUser?.authKey) {
      await sync(stremioUser.authKey);
    }
  };

  const handleItemPress = (item: LibraryItem) => {
    router.push(`/detail/${item.type}/${item.id}`);
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <Skeleton width={90} height={135} borderRadius={8} />
    </View>
  );

  const renderItem = ({ item }: { item: LibraryItem }) => (
    <View style={styles.cardContainer}>
      <MediaCard
        item={item}
        size="sm"
        onPress={() => handleItemPress(item)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Your Stremio library is empty</Text>
      <Text style={styles.emptyText}>
        Add movies and shows to your library from the Stremio app or website.
      </Text>
    </View>
  );

  const filtered = filteredItems();

  return (
    <View style={styles.container}>
      <LibraryFilterBar onSyncPress={handleSync} isSyncing={isSyncing} />
      
      {isLoading ? (
        <FlatList
          data={Array(12).fill(null)}
          keyExtractor={(_, i) => `skeleton-${i}`}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={renderSkeleton}
        />
      ) : filtered.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  grid: {
    padding: 16,
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  skeletonContainer: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
