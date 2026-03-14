import { useState, useEffect } from 'react';

/**
 * Hook to check online/offline status
 * Returns true if connected to internet
 * 
 * Note: Requires @react-native-community/netinfo package
 * Install with: npx expo install @react-native-community/netinfo
 */
export function useOnlineStatus(): boolean {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Try to import NetInfo dynamically
    let unsubscribe: (() => void) | undefined;
    
    const setupNetworkListener = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const NetInfo = require('@react-native-community/netinfo').default;
        
        // Subscribe to network state updates
        unsubscribe = NetInfo.addEventListener((state: any) => {
          setIsConnected(state.isConnected ?? false);
        });

        // Get initial state
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected ?? false);
      } catch (error) {
        // NetInfo not installed - assume online
        console.warn('NetInfo not installed, assuming online:', error);
        setIsConnected(true);
      }
    };

    setupNetworkListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return isConnected;
}

/**
 * Hook to check if device is offline
 * Returns true if NOT connected to internet
 */
export function useOfflineStatus(): boolean {
  const isConnected = useOnlineStatus();
  return !isConnected;
} 
