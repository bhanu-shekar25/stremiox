import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Setup notification channels for Android
 * Call once on app startup
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    // Progress channel - LOW importance, silent, ongoing
    await Notifications.setNotificationChannelAsync('dl-progress', {
      name: 'Download Progress',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [],
      lightColor: '#7b2fff',
      sound: null,
      enableVibrate: false,
      enableLights: true,
      showBadge: false,
    });

    // Complete channel - HIGH importance, sound enabled
    await Notifications.setNotificationChannelAsync('dl-complete', {
      name: 'Download Complete',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Failure channel - DEFAULT importance
    await Notifications.setNotificationChannelAsync('dl-failure', {
      name: 'Download Failed',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ef4444',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });
  }
}

/**
 * Show or update ongoing download progress notification
 */
export async function showProgressNotification(
  id: string,
  title: string,
  progress: number, // 0-1
  speedKBps?: number
): Promise<void> {
  const progressPercent = Math.round(progress * 100);
  
  let subtitle = `${progressPercent}% complete`;
  if (speedKBps) {
    const speedMBps = (speedKBps / 1024).toFixed(2);
    subtitle += ` · ${speedMBps} MB/s`;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body: subtitle,
      sound: false,
      sticky: true,
      autoDismiss: false,
      categoryIdentifier: 'dl-progress',
    },
    trigger: null,
  });
}

/**
 * Show download complete notification
 */
export async function showCompleteNotification(title: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `complete-${Date.now()}`,
    content: {
      title: 'Download Complete',
      body: title,
      sound: true,
      categoryIdentifier: 'dl-complete',
      sticky: false,
      autoDismiss: true,
    },
    trigger: null,
  });
}

/**
 * Show download failure notification
 */
export async function showFailureNotification(
  title: string,
  reason?: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `failure-${Date.now()}`,
    content: {
      title: 'Download Failed',
      body: reason ? `${title}: ${reason}` : title,
      sound: true,
      categoryIdentifier: 'dl-failure',
      sticky: false,
      autoDismiss: true,
    },
    trigger: null,
  });
}

/**
 * Dismiss an ongoing notification
 */
export async function dismissNotification(id: string): Promise<void> {
  await Notifications.dismissNotificationAsync(id);
}

/**
 * Dismiss all download notifications
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
} 
