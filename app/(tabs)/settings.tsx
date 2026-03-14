import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { AccountSection } from '@/features/settings/components/AccountSection';
import { RealDebridSection } from '@/features/settings/components/RealDebridSection';
import { DownloadSection } from '@/features/settings/components/DownloadSection';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { getAppVersion } from '@/features/settings/service';

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  const handleNavigateToAddons = () => {
    router.push('/addons');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SettingsSection title="Account">
          <AccountSection onLogout={handleLogout} />
        </SettingsSection>

        {/* Real-Debrid Section */}
        <SettingsSection title="Real-Debrid">
          <RealDebridSection />
        </SettingsSection>

        {/* Downloads Section */}
        <SettingsSection title="Downloads">
          <DownloadSection />
        </SettingsSection>

        {/* Add-ons Section */}
        <SettingsSection title="Add-ons">
          <TouchableOpacity style={styles.navItem} onPress={handleNavigateToAddons}>
            <View style={styles.itemLeft}>
              <Ionicons name="layers-outline" size={24} color={colors.primary} />
              <Text style={styles.itemTitle}>Manage Add-ons</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="About">
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>{getAppVersion()}</Text>
          </View>
        </SettingsSection>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  navItem: {
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
  itemTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: '500',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  aboutLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  aboutValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
  },
  bottomPadding: {
    height: 32,
  },
});
