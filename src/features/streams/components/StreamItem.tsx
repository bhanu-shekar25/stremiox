import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { Badge } from '@/shared/ui/Badge';
import type { Stream } from '@/types';

interface StreamItemProps {
  stream: Stream;
  onPlay?: () => void;
  onDownload?: () => void;
}

export function StreamItem({ stream, onPlay, onDownload }: StreamItemProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.streamInfo}>
          {/* Quality Badge */}
          {stream.quality && stream.quality !== 'Unknown' && (
            <Badge label={stream.quality} variant={stream.quality as any} size="sm" />
          )}

          {/* RD Cached Indicator */}
          {stream.isRDCached && (
            <View style={styles.rdCachedBadge}>
              <Ionicons name="flash" size={12} color={colors.warning} />
              <Text style={styles.rdCachedText}>RD</Text>
            </View>
          )}

          {/* Stream Name/Title */}
          <Text style={styles.streamName} numberOfLines={2}>
            {stream.name || stream.title || 'Unknown Stream'}
          </Text>
        </View>
      </View>

      {/* Metadata Row */}
      <View style={styles.metadata}>
        {/* File Size */}
        {stream.behaviorHints?.videoSize && (
          <View style={styles.metadataItem}>
            <Ionicons name="server-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metadataText}>{formatFileSize(stream.behaviorHints.videoSize)}</Text>
          </View>
        )}

        {/* Seeders */}
        {stream.behaviorHints?.seeders && (
          <View style={styles.metadataItem}>
            <Ionicons name="arrow-up-outline" size={14} color={colors.success} />
            <Text style={[styles.metadataText, { color: colors.success }]}>
              {stream.behaviorHints.seeders}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Ionicons name="play" size={16} color={colors.background} />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
          <Ionicons name="download-outline" size={16} color={colors.primary} />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    marginBottom: 8,
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    flex: 1,
    lineHeight: 20,
  },
  rdCachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  rdCachedText: {
    color: colors.warning,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  metadata: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  playButtonText: {
    color: colors.background,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 47, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  downloadButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
});
