import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MediaCard } from '@/shared/components/MediaCard';
import { Skeleton } from '@/shared/ui/Skeleton';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import type { LibraryItem } from '@/types';

interface DiscoverGridProps {
  items: LibraryItem[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  onEndReached: () => void;
}

const NUM_COLUMNS = 3;

export function DiscoverGrid({
  items,
  isLoading,
  isFetchingMore,
  hasMore,
  onEndReached,
}: DiscoverGridProps) {
  const router = useRouter();

  const handleItemPress = (item: LibraryItem) => {
    router.push(`/detail/${item.type}/${item.id}`);
  };

  const renderSkeleton = () => (
    <Skeleton width={100} height={150} borderRadius={8} />
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

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null; // Show skeletons instead
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No content available</Text>
      </View>
    );
  };

  // Show skeletons while loading
  if (isLoading) {
    return (
      <FlatList
        data={Array(NUM_COLUMNS * 6).fill(null)}
        keyExtractor={(_, index) => `skeleton-${index}`}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        renderItem={renderSkeleton}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.grid}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 16,
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
}); 
