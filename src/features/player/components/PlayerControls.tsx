import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { formatTime } from '../progress';

interface PlayerControlsProps {
  isVisible: boolean;
  title: string;
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  isSeries?: boolean;
  onBack: () => void;
  onPlayPause: () => void;
  onSeek: (positionMs: number) => void;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  onSubtitlePress?: () => void;
  onAudioPress?: () => void;
}

export function PlayerControls({
  isVisible,
  title,
  positionMs,
  durationMs,
  isPlaying,
  isSeries,
  onBack,
  onPlayPause,
  onSeek,
  onPrevEpisode,
  onNextEpisode,
  onSubtitlePress,
  onAudioPress,
}: PlayerControlsProps) {
  const [localPosition, setLocalPosition] = useState(positionMs);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  // Animate opacity based on isVisible
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  // Update local position when prop changes (only when not dragging)
  useEffect(() => {
    if (!isDragging) {
      setLocalPosition(positionMs);
    }
  }, [positionMs, isDragging]);

  const handleSeekChange = (value: number) => {
    setLocalPosition(value);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
    onSeek(localPosition);
  };

  const seekPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
    },
    onPanResponderMove: (_, gestureState) => {
      const seekRange = durationMs;
      const deltaX = gestureState.moveX;
      const screenWidth = 375; // Approximate
      const newPosition = (deltaX / screenWidth) * seekRange;
      handleSeekChange(Math.max(0, Math.min(newPosition, seekRange)));
    },
    onPanResponderRelease: () => {
      handleSeekEnd();
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Center Controls */}
      <View style={styles.centerControls}>
        {isSeries && (
          <>
            <TouchableOpacity onPress={onPrevEpisode} style={styles.episodeButton}>
              <Ionicons name="play-skip-back" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onNextEpisode} style={styles.episodeButton}>
              <Ionicons name="play-skip-forward" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={48}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {/* Seek Bar */}
        <View style={styles.seekContainer} {...seekPanResponder.panHandlers}>
          <Text style={styles.timeText}>{formatTime(localPosition)}</Text>
          <View style={styles.seekBar}>
            <View
              style={[
                styles.seekBarFill,
                { width: durationMs > 0 ? `${(localPosition / durationMs) * 100}%` : '0%' },
              ]}
            />
            <View
              style={[
                styles.seekThumb,
                { left: durationMs > 0 ? `${(localPosition / durationMs) * 100}%` : '0%' },
              ]}
            />
          </View>
          <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
        </View>

        {/* Right Buttons */}
        <View style={styles.rightButtons}>
          <TouchableOpacity onPress={onAudioPress} style={styles.iconButton}>
            <Ionicons name="volume-high" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubtitlePress} style={styles.iconButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  topBar: {
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    flex: 1,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  episodeButton: {
    padding: 16,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 16,
    gap: 16,
  },
  seekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  seekBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  seekBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginLeft: -8,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    minWidth: 45,
  },
  rightButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
}); 
