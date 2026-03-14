import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import type { LibraryItem } from '@/types';

interface HeroSectionProps {
  item: LibraryItem;
  watchProgress?: number;
  onPlay?: () => void;
  onMoreInfo?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HeroSection({ item, watchProgress, onPlay, onMoreInfo }: HeroSectionProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: item.background || item.poster }}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', colors.background]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        {/* Title and Meta */}
        <View style={styles.metaContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            {item.year && <Text style={styles.metaText}>{item.year}</Text>}
            {item.runtime && (
              <>
                <Text style={styles.metaSeparator}> • </Text>
                <Text style={styles.metaText}>{item.runtime}</Text>
              </>
            )}
            {item.imdbRating && (
              <>
                <Text style={styles.metaSeparator}> • </Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>IMDb {item.imdbRating}</Text>
                </View>
              </>
            )}
          </View>

          {/* Genre Pills */}
          {item.genres && item.genres.length > 0 && (
            <View style={styles.genreContainer}>
              {item.genres.slice(0, 3).map((genre) => (
                <View key={genre} style={styles.genrePill}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Continue Watching Badge */}
        {watchProgress !== undefined && watchProgress > 0 && (
          <View style={styles.continueBadge}>
            <Ionicons name="play-back" size={16} color={colors.primary} />
            <Text style={styles.continueText}>Continue at {formatTime(watchProgress)}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.playButton} onPress={onPlay}>
            <Ionicons name="play" size={20} color={colors.background} />
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={onMoreInfo}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoButtonText}>More Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 300,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  metaContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  metaSeparator: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  ratingBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  genreContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  genrePill: {
    backgroundColor: 'rgba(123, 47, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  continueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    gap: 4,
  },
  continueText: {
    color: colors.background,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  playButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 47, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  infoButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
}); 
