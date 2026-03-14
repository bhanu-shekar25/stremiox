import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import { useAuthStore } from '@/features/auth/store';

interface AccountSectionProps {
  onLogout: () => void;
}

export function AccountSection({ onLogout }: AccountSectionProps) {
  const { stremioUser, rdApiKey, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <View>
      {/* Stremio Account */}
      <TouchableOpacity style={styles.item}>
        <View style={styles.itemLeft}>
          <Ionicons name="person" size={24} color={colors.primary} />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>Stremio Account</Text>
            {stremioUser?.email ? (
              <Text style={styles.itemSubtitle}>{stremioUser.email}</Text>
            ) : (
              <Text style={styles.itemSubtitle}>Not logged in</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Real-Debrid Status */}
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <Ionicons name="cloud" size={24} color={colors.warning} />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>Real-Debrid</Text>
            <Text style={styles.itemSubtitle}>
              {rdApiKey ? 'API key configured' : 'Not configured'}
            </Text>
          </View>
        </View>
        {rdApiKey && (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        )}
      </View>

      <View style={styles.divider} />

      {/* Logout */}
      <TouchableOpacity style={styles.item} onPress={handleLogout}>
        <View style={styles.itemLeft}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={[styles.itemTitle, { color: colors.error }]}>Log Out</Text>
        </View>
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
