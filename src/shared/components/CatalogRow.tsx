import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { MediaCard } from './MediaCard';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { LibraryItem } from '@/types';

interface CatalogRowProps {
  title: string;
  items: LibraryItem[];
  onItemPress: (item: LibraryItem) => void;
  isLoading?: boolean;
  onSeeAll?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 120;
const CARD_MARGIN = 12;
const VISIBLE_COUNT = Math.floor(SCREEN_WIDTH / (CARD_WIDTH + CARD_MARGIN));

export function CatalogRow({ title, items, onItemPress, isLoading, onSeeAll }: CatalogRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAll}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={isLoading ? Array(VISIBLE_COUNT).fill(null) : items}
        keyExtractor={(_, index) => `item-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) =>
          isLoading ? (
            <View style={{ marginLeft: index === 0 ? 16 : 0 }}>
              <Skeleton width={CARD_WIDTH} height={180} borderRadius={8} />
            </View>
          ) : (
            <MediaCard
              item={item}
              size="md"
              onPress={() => onItemPress(item)}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
  },
}); 
