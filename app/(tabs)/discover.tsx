import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDiscoverStore } from '@/features/discover/store';
import { useAddonStore } from '@/features/addons/store';
import { FilterBar } from '@/features/discover/components/FilterBar';
import { DiscoverGrid } from '@/features/discover/components/DiscoverGrid';
import { colors } from '@/core/theme/colors';

interface CatalogSource {
  name: string;
  addonUrl: string;
  catalogId: string;
  type: 'movie' | 'series';
}

export default function DiscoverScreen() {
  const { items, isLoading, isFetchingMore, hasMore, loadPage, reset, type } = useDiscoverStore();
  const { addons } = useAddonStore();

  // Build catalog sources from addons
  const catalogSources: CatalogSource[] = React.useMemo(() => {
    const sources: CatalogSource[] = [];
    
    addons.forEach((addon) => {
      addon.catalogs.forEach((catalog) => {
        sources.push({
          name: `${addon.name} - ${catalog.name}`,
          addonUrl: addon.transportUrl,
          catalogId: catalog.id,
          type: catalog.type as 'movie' | 'series',
        });
      });
    });
    
    return sources;
  }, [addons]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      // Set default catalog if none selected
      if (!useDiscoverStore.getState().activeCatalog && catalogSources.length > 0) {
        // Find first catalog matching current type
        const defaultCatalog = catalogSources.find((s) => s.type === type) || catalogSources[0];
        useDiscoverStore.getState().setCatalog(defaultCatalog);
      } else {
        await loadPage();
      }
    };
    
    loadData();
  }, []);

  const handleEndReached = () => {
    if (!isLoading && !isFetchingMore && hasMore) {
      loadPage();
    }
  };

  return (
    <View style={styles.container}>
      <FilterBar catalogSources={catalogSources} />
      <DiscoverGrid
        items={items}
        isLoading={isLoading}
        isFetchingMore={isFetchingMore}
        hasMore={hasMore}
        onEndReached={handleEndReached}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
