import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { useAuthStore } from '@/features/auth/store';

export function RealDebridSection() {
  const { rdApiKey, setRDKey } = useAuthStore();

  const handleOpenRD = async () => {
    await Linking.openURL('https://real-debrid.com/apitoken');
  };

  return (
    <View>
      {/* API Key Status */}
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <Ionicons
            name={rdApiKey ? 'key' : 'key-outline'}
            size={24}
            color={rdApiKey ? colors.success : colors.textSecondary}
          />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>API Key Status</Text>
            <Text style={styles.itemSubtitle}>
              {rdApiKey ? 'Configured' : 'Not configured'}
            </Text>
          </View>
        </View>
        {rdApiKey && (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        )}
      </View>

      <View style={styles.divider} />

      {/* Get API Key */}
      <TouchableOpacity style={styles.item} onPress={handleOpenRD}>
        <View style={styles.itemLeft}>
          <Ionicons name="open-outline" size={24} color={colors.primary} />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>Get API Key</Text>
            <Text style={styles.itemSubtitle}>
              Open real-debrid.com/apitoken
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Info */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          Real-Debrid is required for downloading content. Get a premium account
          for faster downloads and unrestricted access.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemText: {
    gap: 2,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: '500',
  },
  itemSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: colors.surfaceAlt,
    margin: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
}); 
