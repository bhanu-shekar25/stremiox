import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useDownloadStore } from '@/features/downloads/store';
import { setupNotificationChannels } from '@/features/downloads/notifications';
import { DownloadItem } from '@/features/downloads/components/DownloadItem';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';
import type { Download } from '@/types';

type TabType = 'downloading' | 'completed';

export default function DownloadsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('downloading');
  
  const {
    downloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    refreshDownloads,
  } = useDownloadStore();

  // Setup notification channels on mount
  useEffect(() => {
    setupNotificationChannels();
    refreshDownloads();
  }, []);

  // Get downloads by status
  const downloadsArray = Object.values(downloads);
  const filteredDownloads = downloadsArray.filter((d) => {
    if (activeTab === 'downloading') {
      return ['downloading', 'queued', 'paused'].includes(d.status);
    }
    return d.status === 'completed';
  });

  const handlePlay = (download: Download) => {
    if (download.localPath) {
      router.push({
        pathname: '/player/[id]',
        params: {
          id: download.localPath,
          title: download.title,
          type: download.type,
          imdbId: download.imdbId,
          isOffline: 'true',
        },
      });
    }
  };

  const renderDownload = ({ item }: { item: Download }) => (
    <DownloadItem
      download={item}
      mode={activeTab === 'downloading' ? 'active' : 'completed'}
      onPause={() => pauseDownload(item.id)}
      onResume={() => resumeDownload(item.id)}
      onCancel={() => cancelDownload(item.id)}
      onPlay={() => handlePlay(item)}
      onDelete={() => deleteDownload(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name={activeTab === 'downloading' ? 'cloud-download-outline' : 'cloud-done-outline'} size={48} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'downloading' ? 'No active downloads' : 'No completed downloads'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'downloading'
          ? 'Downloads will appear here'
          : 'Downloaded content will appear here'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.storage}>
          {filteredDownloads.length} {filteredDownloads.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Tab Segmented Control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'downloading' && styles.activeTab]}
          onPress={() => setActiveTab('downloading')}
        >
          <Text style={[styles.tabText, activeTab === 'downloading' && styles.activeTabText]}>
            Downloading
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Downloads List */}
      <FlatList
        data={filteredDownloads}
        keyExtractor={(item) => item.id}
        renderItem={renderDownload}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Import Ionicons after component to avoid issues
import { Ionicons } from '@expo/vector-icons';

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
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  storage: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.background,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
