import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FilterPill } from '@/shared/ui/FilterPill';
import { useDiscoverStore } from '../store';
import { fetchGenres, getSortOptions } from '../api';

interface CatalogSource {
  name: string;
  addonUrl: string;
  catalogId: string;
  type: 'movie' | 'series';
}

interface FilterBarProps {
  catalogSources: CatalogSource[];
}

export function FilterBar({ catalogSources }: FilterBarProps) {
  const { type, genre, sort, setType, setGenre, setSort, setCatalog } = useDiscoverStore();

  const typeOptions = ['Movies', 'Series'];
  // Genres are static for now - in production would be fetched from API
  const genreOptions = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
    'Horror', 'Mystery', 'Romance', 'Science Fiction', 'Thriller',
    'War', 'Western',
  ];
  const sortOptions = getSortOptions();
  
  const sourceOptions = catalogSources.map((s) => s.name);

  const handleTypeChange = (value: string) => {
    setType(value === 'Movies' ? 'movie' : 'series');
  };

  const handleGenreChange = (value: string) => {
    setGenre(value === 'All Genres' ? null : value);
  };

  const handleSourceChange = (value: string) => {
    const selected = catalogSources.find((s) => s.name === value);
    setCatalog(selected || null);
  };

  const currentTypeLabel = type === 'movie' ? 'Movies' : 'Series';
  const currentGenreLabel = genre || 'All Genres';
  const currentSourceLabel = catalogSources.find((s) => s.addonUrl === useDiscoverStore.getState().activeCatalog?.addonUrl)?.name || 'All Sources';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <FilterPill
        label={currentTypeLabel}
        options={typeOptions}
        value={currentTypeLabel}
        onChange={handleTypeChange}
      />
      <View style={styles.separator} />
      <FilterPill
        label={currentSourceLabel}
        options={['All Sources', ...sourceOptions]}
        value={currentSourceLabel}
        onChange={handleSourceChange}
      />
      <View style={styles.separator} />
      <FilterPill
        label={currentGenreLabel}
        options={['All Genres', ...genreOptions]}
        value={currentGenreLabel}
        onChange={handleGenreChange}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d0d0d',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  separator: {
    width: 8,
  },
}); 
