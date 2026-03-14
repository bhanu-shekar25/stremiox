import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { Badge } from '@/shared/ui/Badge';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import type { Stream, LibraryItem } from '@/types';

interface DownloadConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  stream: Stream;
  meta: LibraryItem;
  season?: number;
  episode?: number;
  onConfirm: () => void;
}

export function DownloadConfirmSheet({
  visible,
  onClose,
  stream,
  meta,
  season,
  episode,
  onConfirm,
}: DownloadConfirmSheetProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Download">
      <View style={styles.content}>
        {/* Title and Quality */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {meta.name}
            {season && episode ? ` - S${season}E${episode}` : ''}
          </Text>
          {stream.quality && stream.quality !== 'Unknown' && (
            <Badge label={stream.quality} variant={stream.quality as any} />
          )}
        </View>

        {/* Stream Info */}
        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Ionicons name="cloud-download-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {formatFileSize(stream.behaviorHints?.videoSize)}
            </Text>
          </View>
          
          {stream.addonName && (
            <View style={styles.infoRow}>
              <Ionicons name="layers-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>{stream.addonName}</Text>
            </View>
          )}

          {stream.isRDCached && (
            <View style={styles.infoRow}>
              <Ionicons name="flash" size={18} color={colors.warning} />
              <Text style={styles.infoText}>Real-Debrid Cached</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.downloadButton} onPress={onConfirm}>
            <Ionicons name="download" size={20} color={colors.background} />
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
  },
  info: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  downloadButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
}); 
