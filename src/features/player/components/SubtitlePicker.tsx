import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { BottomSheet } from '@/shared/ui/BottomSheet';

interface SubtitleTrack {
  index: number;
  name: string;
}

interface SubtitlePickerProps {
  visible: boolean;
  onClose: () => void;
  tracks: SubtitleTrack[];
  activeTrackIndex?: number;
  onSelectTrack: (index: number) => void;
}

export function SubtitlePicker({
  visible,
  onClose,
  tracks,
  activeTrackIndex,
  onSelectTrack,
}: SubtitlePickerProps) {
  const allTracks: SubtitleTrack[] = [
    { index: -1, name: 'Off' },
    ...tracks,
  ];

  const renderItem = ({ item }: { item: SubtitleTrack }) => {
    const isActive = item.index === activeTrackIndex;
    
    return (
      <TouchableOpacity
        style={[styles.trackItem, isActive && styles.trackItemActive]}
        onPress={() => {
          onSelectTrack(item.index);
          onClose();
        }}
      >
        <Text style={[styles.trackName, isActive && styles.trackNameActive]}>
          {item.name}
        </Text>
        {isActive && (
          <Ionicons name="checkmark" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Subtitles">
      <FlatList
        data={allTracks}
        keyExtractor={(item) => `subtitle-${item.index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  trackItemActive: {
    backgroundColor: 'rgba(123, 47, 255, 0.2)',
  },
  trackName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  trackNameActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
}); 
