import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';

interface SearchBarProps {
  onPress: () => void;
  placeholder?: string;
}

export function SearchBar({ onPress, placeholder = 'Search movies, shows...' }: SearchBarProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.icon} />
      <Text style={styles.placeholder}>{placeholder}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 200,
  },
  icon: {
    marginRight: 8,
  },
  placeholder: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
}); 
