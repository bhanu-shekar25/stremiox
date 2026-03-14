import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/core/theme/colors';

interface SkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = 100, height = 100, borderRadius = 8 }: SkeletonProps) {
  const animatedValue = new Animated.Value(0.3);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={{ width, height, borderRadius }}>
      <Animated.View
        style={[
          styles.container,
          { flex: 1, opacity: animatedValue, backgroundColor: colors.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
  },
}); 
