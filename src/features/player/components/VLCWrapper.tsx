import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
// Note: react-native-vlc-mediaplayer requires native build
// This is a placeholder component for development
// In production, use: import { VLCPlayer } from 'react-native-vlc-mediaplayer';

export interface VLCPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (positionMs: number) => void;
  setAudioTrack: (index: number) => void;
  setSubtitleTrack: (index: number) => void;
}

interface VLCWrapperProps {
  source: { uri: string };
  startPositionMs?: number;
  subtitleUri?: string;
  style?: ViewStyle;
  onProgress: (positionMs: number, durationMs: number) => void;
  onEnd: () => void;
  onError: (error: any) => void;
  onBuffer: (isBuffering: boolean) => void;
}

export const VLCWrapper = forwardRef<VLCPlayerRef, VLCWrapperProps>(
  ({ source, startPositionMs = 0, subtitleUri, style, onProgress, onEnd, onError, onBuffer }, ref) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(startPositionMs);
    const [duration, setDuration] = useState(0);

    // Expose player methods to parent
    useImperativeHandle(ref, () => ({
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      seek: (positionMs: number) => setCurrentTime(positionMs),
      setAudioTrack: (index: number) => {
        console.log('Set audio track:', index);
      },
      setSubtitleTrack: (index: number) => {
        console.log('Set subtitle track:', index);
        if (index >= 0 && subtitleUri) {
          // Would set subtitle in real VLC player
        }
      },
    }));

    // Simulate progress for development
    React.useEffect(() => {
      if (!isPlaying) return;
      
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 250;
          onProgress(newTime, duration || 100000);
          return newTime;
        });
      }, 250);

      return () => clearInterval(interval);
    }, [isPlaying, duration]);

    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color="#7b2fff" />
          <PlaceholderText>VLC Player (Development Mode)</PlaceholderText>
          <PlaceholderText>URI: {source.uri}</PlaceholderText>
          {subtitleUri && <PlaceholderText>Subtitle: {subtitleUri}</PlaceholderText>}
        </View>
      </View>
    );
  }
);

const PlaceholderText = ({ children }: { children: React.ReactNode }) => (
  <View style={{ marginVertical: 4 }}>
    <Text style={{ color: '#fff', textAlign: 'center' }}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
}); 
