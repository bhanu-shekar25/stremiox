import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Badge } from '@/shared/ui/Badge';
import type { LibraryItem } from '@/types';

interface MediaCardProps {
  item: LibraryItem;
  size?: 'sm' | 'md' | 'lg';
  onPress: () => void;
  watchProgress?: number;
  isDownloaded?: boolean;
  quality?: string;
}

const sizeDimensions = {
  sm: { width: 90, height: 135 },
  md: { width: 120, height: 180 },
  lg: { width: 160, height: 240 },
};

export function MediaCard({
  item,
  size = 'md',
  onPress,
  watchProgress,
  isDownloaded,
  quality,
}: MediaCardProps) {
  const dimensions = sizeDimensions[size];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.imageContainer, { width: dimensions.width, height: dimensions.height }]}>
        <Image
          source={{ uri: item.poster }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        
        {/* Quality Badge - Top Right */}
        {quality && (
          <View style={styles.qualityBadge}>
            <Badge label={quality} variant={quality as any} size="sm" />
          </View>
        )}

        {/* Downloaded Badge - Bottom Right */}
        {isDownloaded && (
          <View style={styles.downloadedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          </View>
        )}

        {/* Title - Bottom Left */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        {/* Progress Bar - Bottom */}
        {watchProgress !== undefined && watchProgress > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={watchProgress} height={3} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  qualityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  downloadedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 6,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
}); 
