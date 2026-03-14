import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { getTotalStorageUsed, formatBytes, deleteAllDownloads } from '../service';
import { useDownloadStore } from '@/features/downloads/store';

export function DownloadSection() {
  const [storageUsed, setStorageUsed] = useState(0);
  const { downloads } = useDownloadStore();
  
  const completedCount = Object.values(downloads).filter(
    (d) => d.status === 'completed'
  ).length;

  useEffect(() => {
    const loadStorage = async () => {
      const used = await getTotalStorageUsed();
      setStorageUsed(used);
    };
    loadStorage();
  }, [downloads]);

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Downloads',
      'Are you sure you want to delete all downloaded content? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllDownloads();
            setStorageUsed(0);
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* Storage Used */}
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <Ionicons name="server" size={24} color={colors.primary} />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>Storage Used</Text>
            <Text style={styles.itemSubtitle}>{formatBytes(storageUsed)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Completed Downloads */}
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <Ionicons name="cloud-download-outline" size={24} color={colors.success} />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>Completed Downloads</Text>
            <Text style={styles.itemSubtitle}>{completedCount} items</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Delete All */}
      <TouchableOpacity style={styles.item} onPress={handleDeleteAll}>
        <View style={styles.itemLeft}>
          <Ionicons name="trash" size={24} color={colors.error} />
          <Text style={[styles.itemTitle, { color: colors.error }]}>
            Delete All Downloads
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
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
}); 
