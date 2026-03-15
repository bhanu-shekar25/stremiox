import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const getAddonIcon = (addonName: string) => {
    if (addonName.toLowerCase().includes('torrentio')) return 'cloud-outline';
    if (addonName.toLowerCase().includes('cinemeta')) return 'film-outline';
    if (addonName.toLowerCase().includes('openload')) return 'play-circle-outline';
    if (addonName.toLowerCase().includes('realdebrid') || addonName.toLowerCase().includes('rd')) return 'flash-outline';
    return 'apps-outline';
  };

  const renderSectionHeader = (addonName: string, streamCount: number) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        <Ionicons name={getAddonIcon(addonName)} size={16} color={colors.textSecondary} />
        <Text style={styles.sectionHeaderText}>{addonName}</Text>
        <View style={styles.streamCountBadge}>
          <Text style={styles.streamCountText}>{streamCount}</Text>
        </View>
      </View>
      <View style={styles.sectionDivider} />
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Finding streams...</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="film-outline" size={48} color={colors.textSecondary} />
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
        <View key={addonName} style={styles.addonSection}>
          {renderSectionHeader(addonName, addonStreams.length)}
          {addonStreams.map((stream, index) => (
            <StreamItem
              key={`${addonName}-${index}`}
              stream={stream}
              onPlay={() => onPlay(stream)}
              onDownload={() => onDownload(stream)}
            />
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
  addonSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  streamCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamCountText: {
    color: colors.background,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
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
