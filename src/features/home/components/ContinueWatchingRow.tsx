import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { MediaCard } from '@/shared/components/MediaCard';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import type { WatchProgress } from '@/types';

interface ContinueWatchingRowProps {
  items: WatchProgress[];
}

export function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  const router = useRouter();

  if (items.length === 0) return null;

  const handlePress = (item: WatchProgress) => {
    if (item.type === 'movie') {
      router.push(`/detail/${item.type}/${item.imdbId}`);
    } else {
      // For series, navigate to detail with episode context
      router.push(`/detail/${item.type}/${item.imdbId}`);
    }
  };

  const formatProgress = (positionMs: number, durationMs: number) => {
    const totalSeconds = Math.floor(positionMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Continue Watching</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <MediaCard
              item={{
                id: item.imdbId,
                type: item.type,
                name: item.title,
                poster: item.posterUrl || '',
              }}
              size="md"
              onPress={() => handlePress(item)}
              watchProgress={item.durationMs > 0 ? item.positionMs / item.durationMs : 0}
            />
            
            {/* Episode info for series */}
            {item.type === 'series' && item.season && item.episode && (
              <View style={styles.episodeInfo}>
                <Ionicons name="tv-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.episodeText}>
                  S{item.season} E{item.episode}
                </Text>
              </View>
            )}

            {/* Time remaining */}
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>
                {formatProgress(item.positionMs, item.durationMs)} /{' '}
                {formatProgress(item.durationMs, item.durationMs)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    marginRight: 12,
  },
  episodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  episodeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  timeInfo: {
    marginTop: 4,
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
}); 
