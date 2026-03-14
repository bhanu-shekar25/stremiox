import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/core/theme/colors';
import { typography } from '@/core/theme/typography';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeColors: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.primary,
};

const typeIcons: Record<ToastType, any> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const fadeAnim = new Animated.Value(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      hideToast(id);
    }, 3000);
  }, []);

  const hideToast = useCallback((id: string) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toasts.length > 0 && (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {toasts.map((toast) => (
            <View key={toast.id} style={[styles.toast, { borderLeftColor: typeColors[toast.type] }]}>
              <Ionicons name={typeIcons[toast.type]} size={20} color={typeColors[toast.type]} />
              <Text style={styles.message}>{toast.message}</Text>
            </View>
          ))}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
  },
}); 
