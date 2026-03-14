import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { MediaCard } from '@/shared/components/MediaCard';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { LibraryItem } from '@/types';
import { searchAll } from '@/features/metadata/search';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
} from '@/features/search/recentSearches';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    const loadRecent = async () => {
      const searches = await getRecentSearches();
      setRecentSearches(searches);
    };
    loadRecent();
  }, []);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchAll(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectRecent = async (term: string) => {
    setQuery(term);
    await addRecentSearch(term);
  };

  const handleRemoveRecent = async (term: string) => {
    await removeRecentSearch(term);
    setRecentSearches((prev) => prev.filter((t) => t !== term));
  };

  const handleSelectResult = async (item: LibraryItem) => {
    // Save to recent searches
    if (query.trim().length > 0) {
      await addRecentSearch(query.trim());
      setRecentSearches((prev) => {
        const filtered = prev.filter((t) => t !== query.trim());
        return [query.trim(), ...filtered].slice(0, 10);
      });
    }
    
    // Navigate to detail
    router.push(`/detail/${item.type}/${item.id}`);
  };

  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
  };

  const renderRecentSearches = () => (
    <View style={styles.recentContainer}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Searches</Text>
        {recentSearches.length > 0 && (
          <TouchableOpacity onPress={() => {
            setRecentSearches([]);
            getRecentSearches().then(() => {});
          }}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.chips}>
        {recentSearches.map((term) => (
          <View key={term} style={styles.chip}>
            <TouchableOpacity
              style={styles.chipContent}
              onPress={() => handleSelectRecent(term)}
            >
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.chipText}>{term}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chipRemove}
              onPress={() => handleRemoveRecent(term)}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <Skeleton width={100} height={150} borderRadius={8} />
    </View>
  );

  const renderResult = ({ item }: { item: LibraryItem }) => (
    <View style={styles.cardContainer}>
      <MediaCard
        item={item}
        size="sm"
        onPress={() => handleSelectResult(item)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>No results for "{query}"</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, shows..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={
          query.length === 0
            ? [{ type: 'recent' }]
            : isLoading
            ? Array(9).fill({ type: 'skeleton' })
            : results.length === 0
            ? [{ type: 'empty' }]
            : results.map((item) => ({ type: 'result', item }))
        }
        keyExtractor={(_, index) => `item-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'recent') {
            return renderRecentSearches();
          }
          if (item.type === 'skeleton') {
            return renderSkeleton();
          }
          if (item.type === 'empty') {
            return renderEmpty();
          }
          return renderResult({ item: item.item });
        }}
        numColumns={query.length > 0 ? 3 : undefined}
        contentContainerStyle={
          query.length > 0 && !isLoading && results.length === 0
            ? styles.emptyContainer
            : styles.content
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  recentContainer: {
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clearText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingRight: 4,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  chipRemove: {
    padding: 4,
  },
  skeletonContainer: {
    width: '33.33%',
    padding: 6,
  },
  cardContainer: {
    width: '33.33%',
    padding: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.lg,
  },
});
