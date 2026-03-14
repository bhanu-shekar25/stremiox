import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';

interface OfflineBannerProps {
  message?: string;
}

export function OfflineBanner({ message = 'You are offline — showing cached content' }: OfflineBannerProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={18} color={colors.warning} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: colors.background,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
}); 
