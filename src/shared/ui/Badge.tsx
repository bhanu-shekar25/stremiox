import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';

interface BadgeProps {
  label: string;
  variant?: '4K' | '1080p' | '720p' | 'HDR' | 'RD' | 'default';
  size?: 'sm' | 'md';
}

const variantColors: Record<string, string> = {
  '4K': '#f59e0b',
  'UHD': '#f59e0b',
  '1080p': '#7b2fff',
  '720p': '#3b82f6',
  'HDR': '#22c55e',
  'RD': '#ff6b35',
};

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  const backgroundColor = variantColors[variant] || variantColors['1080p'];

  return (
    <View style={[styles.container, size === 'sm' && styles.sm, { backgroundColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
}); 
