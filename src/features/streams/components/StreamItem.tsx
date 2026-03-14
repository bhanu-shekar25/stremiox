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
          
          {/* Stream Name/Title */}
          <Text style={styles.streamName} numberOfLines={1}>
            {stream.name || stream.title || 'Unknown Stream'}
          </Text>
          
          {/* RD Cached Indicator */}
          {stream.isRDCached && (
            <Ionicons name="flash" size={14} color={colors.warning} style={styles.rdIcon} />
          )}
        </View>
        
        {/* File Size */}
        {stream.behaviorHints?.videoSize && (
          <Text style={styles.fileSize}>
            {formatFileSize(stream.behaviorHints.videoSize)}
          </Text>
        )}
      </View>
      
      {/* Addon Name */}
      {stream.addonName && (
        <Text style={styles.addonName}>{stream.addonName}</Text>
      )}
      
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  streamName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  rdIcon: {
    marginLeft: 4,
  },
  fileSize: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  addonName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  playButtonText: {
    color: colors.background,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 47, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  downloadButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
}); 
