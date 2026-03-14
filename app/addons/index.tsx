import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAddonStore } from '@/features/addons/store';
import { AddonList } from '@/features/addons/components/AddonList';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';

export default function AddonsScreen() {
  const router = useRouter();
  const { addons, sync, isLoading } = useAddonStore();
  const [enabledAddons, setEnabledAddons] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize enabled addons from all addons (all enabled by default)
  useEffect(() => {
    if (addons.length > 0 && enabledAddons.length === 0) {
      setEnabledAddons(addons.map((a) => a.id));
    }
  }, [addons]);

  const handleSync = async () => {
    setIsSyncing(true);
    await sync();
    setIsSyncing(false);
  };

  const handleToggle = (addonId: string, enabled: boolean) => {
    setEnabledAddons((prev) => {
      if (enabled) {
        return [...prev, addonId];
      }
      return prev.filter((id) => id !== addonId);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Installed Add-ons</Text>
        </View>
        
        <TouchableOpacity
          onPress={handleSync}
          style={styles.syncButton}
          disabled={isSyncing || isLoading}
        >
          {isSyncing || isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Addon List */}
      <AddonList
        addons={addons}
        enabledAddons={enabledAddons}
        onToggle={handleToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  syncButton: {
    padding: 8,
  },
});
