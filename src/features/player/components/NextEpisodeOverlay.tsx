import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { ProgressBar } from '@/shared/ui/ProgressBar';

interface NextEpisodeOverlayProps {
  visible: boolean;
  title: string;
  season: number;
  episode: number;
  onPlayNext: () => void;
  onDismiss: () => void;
}

export function NextEpisodeOverlay({
  visible,
  title,
  season,
  episode,
  onPlayNext,
  onDismiss,
}: NextEpisodeOverlayProps) {
  const [countdown, setCountdown] = useState(5);
  const translateY = React.useRef(new Animated.Value(300)).current;

  // Reset countdown when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setCountdown(5);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  // Auto-play when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && visible) {
      onPlayNext();
    }
  }, [countdown, visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.nextLabel}>Up Next</Text>
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.episodeTitle} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.episodeNumber}>
          S{season} · E{episode + 1}
        </Text>

        {/* Countdown Progress Bar */}
        <View style={styles.countdownContainer}>
          <ProgressBar progress={1 - countdown / 5} height={4} color={colors.primary} />
          <Text style={styles.countdownText}>
            Playing next in {countdown}s
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playNextButton} onPress={onPlayNext}>
            <Ionicons name="play" size={20} color={colors.background} />
            <Text style={styles.playNextButtonText}>Play Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextLabel: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dismissButton: {
    padding: 4,
  },
  episodeTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    flex: 1,
  },
  episodeNumber: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  countdownContainer: {
    gap: 8,
  },
  countdownText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    textAlign: 'right',
  },
  actions: {
    marginTop: 8,
  },
  playNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
  },
  playNextButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
}); 
