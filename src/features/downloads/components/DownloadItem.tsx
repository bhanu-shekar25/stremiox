import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Badge } from '@/shared/ui/Badge';
import type { Download } from '@/types';

interface DownloadItemProps {
  download: Download;
  mode: 'active' | 'completed';
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onPlay?: () => void;
  onDelete?: () => void;
}

export function DownloadItem({
  download,
  mode,
  onPause,
  onResume,
  onCancel,
  onPlay,
  onDelete,
}: DownloadItemProps) {
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    const mbps = bytesPerSecond / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
  };

  const getStatusText = () => {
    switch (download.status) {
      case 'downloading':
        return 'Downloading...';
      case 'queued':
        return 'Queued';
      case 'paused':
        return 'Paused';
      case 'failed':
        return 'Failed';
      case 'completed':
        return 'Completed';
      default:
        return '';
    }
  };

  if (mode === 'completed') {
    return (
      <View style={styles.container}>
        {/* Poster */}
        {download.posterUrl && (
          <Image source={{ uri: download.posterUrl }} style={styles.poster} />
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {download.title}
              </Text>
              {download.season && download.episode && (
                <Text style={styles.episode}>
                  S{download.season} · E{download.episode}
                </Text>
              )}
            </View>
            
            {download.quality && download.quality !== 'Unknown' && (
              <Badge label={download.quality} variant={download.quality as any} />
            )}
          </View>

          <Text style={styles.size}>{formatFileSize(download.fileSize)}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.playButton} onPress={onPlay}>
              <Ionicons name="play" size={18} color={colors.background} />
              <Text style={styles.playButtonText}>Watch</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Active download mode
  return (
    <View style={styles.container}>
      {/* Poster */}
      {download.posterUrl && (
        <Image source={{ uri: download.posterUrl }} style={styles.poster} />
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {download.title}
            </Text>
            {download.season && download.episode && (
              <Text style={styles.episode}>
                S{download.season} · E{download.episode}
              </Text>
            )}
          </View>
          
          <Text style={styles.status}>{getStatusText()}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <ProgressBar progress={download.progress} height={4} />
          <Text style={styles.progressText}>
            {Math.round(download.progress * 100)}%
          </Text>
        </View>

        {/* Speed and Size */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {formatFileSize(download.downloadedBytes)} / {formatFileSize(download.fileSize)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {download.status === 'downloading' ? (
            <TouchableOpacity style={styles.actionButton} onPress={onPause}>
              <Ionicons name="pause" size={18} color={colors.textPrimary} />
              <Text style={styles.actionButtonText}>Pause</Text>
            </TouchableOpacity>
          ) : download.status === 'paused' ? (
            <TouchableOpacity style={styles.actionButton} onPress={onResume}>
              <Ionicons name="play" size={18} color={colors.textPrimary} />
              <Text style={styles.actionButtonText}>Resume</Text>
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
            <Ionicons name="close" size={18} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  episode: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  status: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    minWidth: 35,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  size: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
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
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 6,
  },
  playButtonText: {
    color: colors.background,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  deleteButton: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
}); 
