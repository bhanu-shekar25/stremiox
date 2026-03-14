import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { StreamItem } from './StreamItem';
import type { Stream } from '@/types';

interface StreamListProps {
  streams: Stream[];
  isLoading: boolean;
  onPlay: (stream: Stream) => void;
  onDownload: (stream: Stream) => void;
}

export function StreamList({ streams, isLoading, onPlay, onDownload }: StreamListProps) {
  // Group streams by addon
  const streamsByAddon = React.useMemo(() => {
    const grouped: Record<string, Stream[]> = {};
    
    streams.forEach((stream) => {
      const addonKey = stream.addonName || 'Unknown';
      if (!grouped[addonKey]) {
        grouped[addonKey] = [];
      }
      grouped[addonKey].push(stream);
    });
    
    return grouped;
  }, [streams]);

  const renderSectionHeader = (addonName: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{addonName}</Text>
    </View>
  );

  const renderStream = ({ item }: { item: Stream }) => (
    <StreamItem
      stream={item}
      onPlay={() => onPlay(item)}
      onDownload={() => onDownload(item)}
    />
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Finding streams...</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No streams available</Text>
      <Text style={styles.emptySubtext}>
        Try installing more add-ons from Settings
      </Text>
    </View>
  );

  if (isLoading && streams.length === 0) {
    return renderLoading();
  }

  if (streams.length === 0) {
    return renderEmpty();
  }

  return (
    <View style={styles.container}>
      {Object.entries(streamsByAddon).map(([addonName, addonStreams]) => (
        <View key={addonName}>
          {renderSectionHeader(addonName)}
          {addonStreams.map((stream, index) => (
            <View key={`${addonName}-${index}`}>{renderStream({ item: stream })}</View>
          ))}
        </View>
      ))}
      
      {isLoading && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingMoreText}>Loading more streams...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
}); 
