import React from 'react';
import { View, Text, FlatList, StyleSheet, SectionList } from 'react-native';
import { AddonCard } from './AddonCard';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import type { AddonManifest } from '@/types';

interface AddonListProps {
  addons: AddonManifest[];
  enabledAddons: string[]; // Array of addon IDs that are enabled
  onToggle: (addonId: string, enabled: boolean) => void;
}

export function AddonList({ addons, enabledAddons, onToggle }: AddonListProps) {
  // Separate addons into active and disabled sections
  const activeAddons = addons.filter((addon) => enabledAddons.includes(addon.id));
  const disabledAddons = addons.filter((addon) => !enabledAddons.includes(addon.id));

  const sections = [
    { title: 'Active', data: activeAddons },
    { title: 'Disabled', data: disabledAddons },
  ].filter((section) => section.data.length > 0);

  const renderSectionHeader = ({ section }: { section: { title: string; data: AddonManifest[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: AddonManifest }) => (
    <AddonCard
      addon={item}
      isEnabled={enabledAddons.includes(item.id)}
      onToggle={(enabled) => onToggle(item.id, enabled)}
    />
  );

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No add-ons installed</Text>
        <Text style={styles.emptySubtext}>
          Open the Stremio desktop app to install add-ons
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  sectionCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
}); 
