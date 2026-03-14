import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { BottomSheet } from '@/shared/ui/BottomSheet';

interface AudioTrack {
  index: number;
  name: string;
  language?: string;
}

interface AudioPickerProps {
  visible: boolean;
  onClose: () => void;
  tracks: AudioTrack[];
  activeTrackIndex?: number;
  onSelectTrack: (index: number) => void;
}

export function AudioPicker({
  visible,
  onClose,
  tracks,
  activeTrackIndex,
  onSelectTrack,
}: AudioPickerProps) {
  const renderItem = ({ item }: { item: AudioTrack }) => {
    const isActive = item.index === activeTrackIndex;
    
    return (
      <TouchableOpacity
        style={[styles.trackItem, isActive && styles.trackItemActive]}
        onPress={() => {
          onSelectTrack(item.index);
          onClose();
        }}
      >
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, isActive && styles.trackNameActive]}>
            {item.name}
          </Text>
          {item.language && (
            <Text style={styles.trackLanguage}>{item.language}</Text>
          )}
        </View>
        {isActive && (
          <Ionicons name="checkmark" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Audio">
      <FlatList
        data={tracks}
        keyExtractor={(item) => `audio-${item.index}`}
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
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  trackNameActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  trackLanguage: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
}); 
