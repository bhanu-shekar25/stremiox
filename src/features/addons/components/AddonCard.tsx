import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { Badge } from '@/shared/ui/Badge';
import type { AddonManifest } from '@/types';

interface AddonCardProps {
  addon: AddonManifest;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AddonCard({ addon, isEnabled, onToggle }: AddonCardProps) {
  const getResourcePills = () => {
    const pills: string[] = [];
    if (addon.resources.includes('stream')) pills.push('Streams');
    if (addon.resources.includes('catalog')) pills.push('Catalogs');
    if (addon.resources.includes('subtitles')) pills.push('Subtitles');
    return pills;
  };

  const resourcePills = getResourcePills();

  return (
    <View style={styles.container}>
      {/* Logo */}
      {addon.logo ? (
        <Image source={{ uri: addon.logo }} style={styles.logo} contentFit="contain" />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder]}>
          <Ionicons name="layers-outline" size={24} color={colors.textSecondary} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {addon.name}
          </Text>
          <Switch
            value={isEnabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        {addon.version && (
          <Text style={styles.version}>v{addon.version}</Text>
        )}

        {addon.description && (
          <Text style={styles.description} numberOfLines={2}>
            {addon.description}
          </Text>
        )}

        {/* Resource Pills */}
        <View style={styles.pills}>
          {resourcePills.map((pill) => (
            <Badge key={pill} label={pill} variant="default" size="sm" />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  version: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  pills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
}); 
