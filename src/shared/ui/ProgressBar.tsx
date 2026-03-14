import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '@/core/theme/colors';

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  height = 3,
  animated = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  if (animated) {
    const animatedWidth = new Animated.Value(clampedProgress * 100);
    Animated.timing(animatedWidth, {
      toValue: clampedProgress * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();

    return (
      <View style={[styles.container, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }) },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.fill, { backgroundColor: color, width: `${clampedProgress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
}); 
