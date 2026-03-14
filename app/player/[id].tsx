import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlayerStore } from '@/features/player/store';
import { VLCWrapper, VLCPlayerRef } from '@/features/player/components/VLCWrapper';
import { PlayerControls } from '@/features/player/components/PlayerControls';
import { SubtitlePicker } from '@/features/player/components/SubtitlePicker';
import { AudioPicker } from '@/features/player/components/AudioPicker';
import { NextEpisodeOverlay } from '@/features/player/components/NextEpisodeOverlay';
import { saveProgress, loadProgress, markCompleted, formatTime } from '@/features/player/progress';
import { colors } from '@/core/theme/colors';

export default function PlayerScreen() {
  const router = useRouter();
  const { id, title, type, imdbId, isOffline, subtitleUri } = useLocalSearchParams<{
    id: string;
    title: string;
    type: string;
    imdbId: string;
    isOffline?: string;
    subtitleUri?: string;
  }>();

  const playerRef = useRef<VLCPlayerRef>(null);
  const { positionMs, durationMs, setProgress, setBuffering, setPlaying, reset } = usePlayerStore();

  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSubtitlePicker, setShowSubtitlePicker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState(0);

  const isSeries = type === 'series';
  const isOfflinePlayback = isOffline === 'true';

  // Load saved progress on mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (id) {
        const saved = await loadProgress(id);
        if (saved && saved.positionMs > 0) {
          setStartPosition(saved.positionMs);
        }
      }
    };
    loadSavedProgress();

    return () => {
      // Save progress on unmount
      if (positionMs > 0 && durationMs > 0) {
        saveProgressToDb();
      }
      reset();
    };
  }, []);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  // Save progress every 5 seconds
  useEffect(() => {
    const now = Date.now();
    if (positionMs > 0 && durationMs > 0 && now - lastSaveTime > 5000) {
      saveProgressToDb();
      setLastSaveTime(now);
    }
  }, [positionMs, durationMs]);

  // Show next episode overlay when 30s remaining
  useEffect(() => {
    if (isSeries && durationMs - positionMs < 30000 && durationMs - positionMs > 0) {
      setShowNextEpisode(true);
    } else {
      setShowNextEpisode(false);
    }
  }, [positionMs, durationMs, isSeries]);

  const saveProgressToDb = async () => {
    if (!id || !imdbId || !title) return;

    await saveProgress({
      id,
      imdbId,
      type: type as 'movie' | 'series',
      title,
      positionMs,
      durationMs,
      isOffline: isOfflinePlayback,
    });
  };

  const handleProgress = (newPositionMs: number, newDurationMs: number) => {
    setProgress(newPositionMs, newDurationMs);
  };

  const handleEnd = async () => {
    if (id) {
      await markCompleted(id);
    }
    if (isSeries) {
      setShowNextEpisode(true);
    } else {
      router.back();
    }
  };

  const handleError = (error: any) => {
    console.error('Player error:', error);
  };

  const handleBuffer = (isBuffering: boolean) => {
    setBuffering(isBuffering);
  };

  const handleSeek = (newPositionMs: number) => {
    playerRef.current?.seek(newPositionMs);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setPlaying(!isPlaying);
  };

  const handleBack = async () => {
    await saveProgressToDb();
    router.back();
  };

  const handlePlayNext = () => {
    setShowNextEpisode(false);
    // Would navigate to next episode here
    console.log('Play next episode');
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Video Player */}
      <VLCWrapper
        ref={playerRef}
        source={{ uri: id }}
        startPositionMs={startPosition}
        subtitleUri={subtitleUri}
        style={styles.player}
        onProgress={handleProgress}
        onEnd={handleEnd}
        onError={handleError}
        onBuffer={handleBuffer}
      />

      {/* Buffering Indicator */}
      {usePlayerStore.getState().isBuffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Controls Overlay */}
      <PlayerControls
        isVisible={showControls}
        title={title}
        positionMs={positionMs}
        durationMs={durationMs}
        isPlaying={isPlaying}
        isSeries={isSeries}
        onBack={handleBack}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onSubtitlePress={() => setShowSubtitlePicker(true)}
        onAudioPress={() => setShowAudioPicker(true)}
      />

      {/* Tap zones for showing/hiding controls */}
      <View style={styles.tapZone} onTouchStart={toggleControls} />

      {/* Subtitle Picker */}
      <SubtitlePicker
        visible={showSubtitlePicker}
        onClose={() => setShowSubtitlePicker(false)}
        tracks={[
          { index: 0, name: 'English' },
          { index: 1, name: 'Spanish' },
        ]}
        onSelectTrack={(index) => playerRef.current?.setSubtitleTrack(index)}
      />

      {/* Audio Picker */}
      <AudioPicker
        visible={showAudioPicker}
        onClose={() => setShowAudioPicker(false)}
        tracks={[
          { index: 0, name: 'English', language: 'Original' },
          { index: 1, name: 'Spanish', language: 'Dubbed' },
        ]}
        onSelectTrack={(index) => playerRef.current?.setAudioTrack(index)}
      />

      {/* Next Episode Overlay */}
      <NextEpisodeOverlay
        visible={showNextEpisode}
        title={`${title} - Next Episode`}
        season={1}
        episode={1}
        onPlayNext={handlePlayNext}
        onDismiss={() => setShowNextEpisode(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  player: {
    flex: 1,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tapZone: {
    ...StyleSheet.absoluteFillObject,
  },
});
