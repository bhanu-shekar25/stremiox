import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { getMeta } from '@/features/metadata/cinemeta';
import { getStreamsFromAllAddons } from '@/features/streams/fetcher';
import { StreamList } from '@/features/streams/components/StreamList';
import { Badge } from '@/shared/ui/Badge';
import { useAddonStore } from '@/features/addons/store';
import type { LibraryItem, Stream } from '@/types';

export default function DetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const syncAddons = useAddonStore((state) => state.sync);
  const hasAddons = useAddonStore((state) => state.hasAddons());
  const addonsCount = useAddonStore((state) => state.addons.length);

  const [meta, setMeta] = useState<LibraryItem | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isLoadingStreams, setIsLoadingStreams] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!type || !id) return;

      setError(null);
      setIsLoadingMeta(true);
      setIsLoadingStreams(true);

      try {
        // Ensure addons are synced before fetching streams
        if (!hasAddons || addonsCount <= 3) {
          console.log('[Detail] Syncing addons before fetching streams...');
          await syncAddons();
        }

        // Fetch metadata and streams in parallel
        const [metaData, streamData] = await Promise.all([
          getMeta(type as 'movie' | 'series', id),
          getStreamsFromAllAddons(type as 'movie' | 'series', id),
        ]);

        setMeta(metaData);
        setStreams(streamData);
        console.log('[Detail] Loaded', streamData.length, 'streams from', 
          new Set(streamData.map(s => s.addonName)).size, 'addons');
      } catch (err) {
        console.error('Failed to load detail:', err);
        setError('Failed to load content');
      } finally {
        setIsLoadingMeta(false);
        setIsLoadingStreams(false);
      }
    };

    loadData();
  }, [type, id]);

  const handlePlay = (stream?: Stream) => {
    // Navigate to player with stream URL
    const streamToPlay = stream || streams.find((s) => s.isRDCached) || streams[0];
    
    if (!streamToPlay) return;
    
    // Build params object
    const params: Record<string, string> = {
      title: meta?.name || '',
      type: type || 'movie',
      imdbId: id || '',
    };
    
    // For torrent streams (with infoHash), pass the torrent info
    if (streamToPlay.infoHash) {
      params.infoHash = streamToPlay.infoHash;
      params.fileIdx = streamToPlay.fileIdx?.toString() || '0';
      params.id = streamToPlay.infoHash; // Use infoHash as the ID for routing
    } else if (streamToPlay.url) {
      // Direct URL stream - encode it for URL safety
      params.id = encodeURIComponent(streamToPlay.url);
    }
    
    router.push({
      pathname: '/player',
      params,
    });
  };

  const handleDownload = (stream: Stream) => {
    // Start download with the selected stream
    console.log('Starting download for stream:', stream);
    // The download will be handled by the download engine
    // For now, show a message
    Alert.alert('Download Started', 'Your download will begin shortly. Check the Downloads tab for progress.');
  };

  const handleBack = () => {
    router.back();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoadingMeta || !meta) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <ImageBackground
          source={{ uri: meta.background || meta.poster }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', colors.background]}
            style={styles.heroGradient}
          />
        </ImageBackground>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.heroContent}>
          <View style={styles.heroMeta}>
            <Image
              source={{ uri: meta.poster }}
              style={styles.poster}
              contentFit="cover"
            />
            <View style={styles.heroText}>
              <Text style={styles.title}>{meta.name}</Text>
              
              <View style={styles.metaRow}>
                {meta.year && <Text style={styles.metaText}>{meta.year}</Text>}
                {meta.runtime && (
                  <>
                    <Text style={styles.metaSeparator}> • </Text>
                    <Text style={styles.metaText}>{meta.runtime}</Text>
                  </>
                )}
                {meta.imdbRating && (
                  <>
                    <Text style={styles.metaSeparator}> • </Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>IMDb {meta.imdbRating}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Genre Pills */}
              {meta.genres && meta.genres.length > 0 && (
                <View style={styles.genres}>
                  {meta.genres.slice(0, 3).map((genre) => (
                    <Badge key={genre} label={genre} variant="default" size="sm" />
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlay()}
            >
              <Ionicons name="play" size={20} color={colors.background} />
              <Text style={styles.playButtonText}>Play Best</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => {
                // Scroll to streams section
              }}
            >
              <Ionicons name="download-outline" size={20} color={colors.primary} />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Description */}
      {meta.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.description}>{meta.description}</Text>
        </View>
      )}

      {/* Cast */}
      {meta.cast && meta.cast.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {meta.cast.map((actor, index) => (
              <View key={index} style={styles.castChip}>
                <Text style={styles.castText}>{actor}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Director */}
      {meta.director && meta.director.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Director</Text>
          <Text style={styles.directorText}>{meta.director.join(', ')}</Text>
        </View>
      )}

      {/* Streams Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streams</Text>
        <StreamList
          streams={streams}
          isLoading={isLoadingStreams}
          onPlay={handlePlay}
          onDownload={handleDownload}
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  hero: {
    position: 'relative',
    height: 400,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  heroText: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
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
    marginHorizontal: 4,
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
  genres: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textPrimary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  playButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
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
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  castChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  castText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  },
  directorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  bottomPadding: {
    height: 32,
  },
});
