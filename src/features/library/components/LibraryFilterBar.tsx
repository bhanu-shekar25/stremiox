import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterPill } from '@/shared/ui/FilterPill';
import { useLibraryStore } from '../store';
import { colors } from '@/core/theme/colors';

interface LibraryFilterBarProps {
  onSyncPress?: () => void;
  isSyncing?: boolean;
}

export function LibraryFilterBar({ onSyncPress, isSyncing }: LibraryFilterBarProps) {
  const { typeFilter, sortBy, setTypeFilter, setSortBy } = useLibraryStore();

  const typeOptions = ['All', 'Movies', 'Series'];
  const sortOptions = ['Name', 'Year', 'Rating', 'Watched'];

  const handleTypeChange = (value: string) => {
    const filterMap: Record<string, 'all' | 'movie' | 'series'> = {
      'All': 'all',
      'Movies': 'movie',
      'Series': 'series',
    };
    setTypeFilter(filterMap[value] || 'all');
  };

  const handleSortChange = (value: string) => {
    const sortMap: Record<string, 'watched' | 'name' | 'year' | 'rating'> = {
      'Watched': 'watched',
      'Name': 'name',
      'Year': 'year',
      'Rating': 'rating',
    };
    setSortBy(sortMap[value] || 'watched');
  };

  const currentTypeLabel = typeFilter === 'all' ? 'All' : typeFilter === 'movie' ? 'Movies' : 'Series';
  const currentSortLabel = sortBy.charAt(0).toUpperCase() + sortBy.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterPill
          label={currentTypeLabel}
          options={typeOptions}
          value={currentTypeLabel}
          onChange={handleTypeChange}
        />
        <View style={styles.separator} />
        <FilterPill
          label={currentSortLabel}
          options={sortOptions}
          value={currentSortLabel}
          onChange={handleSortChange}
        />
      </View>
      
      <TouchableOpacity style={styles.syncButton} onPress={onSyncPress} disabled={isSyncing}>
        <Ionicons
          name={isSyncing ? 'refresh' : 'refresh-outline'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    width: 8,
  },
  syncButton: {
    padding: 8,
  },
}); 
