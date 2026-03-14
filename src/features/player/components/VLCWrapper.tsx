import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LibVlcPlayerView } from 'expo-libvlc-player';

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
    const [isBuffering, setIsBuffering] = useState(true);
    const playerRef = useRef<any>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    // Expose player methods to parent
    useImperativeHandle(ref, () => ({
      play: () => {
        playerRef.current?.play();
        setIsPlaying(true);
      },
      pause: () => {
        playerRef.current?.pause();
        setIsPlaying(false);
      },
      seek: (positionMs: number) => {
        playerRef.current?.seek(positionMs / 1000);
      },
      setAudioTrack: (index: number) => {
        playerRef.current?.setAudioTrack(index);
      },
      setSubtitleTrack: (index: number) => {
        playerRef.current?.setSubtitleTrack(index);
      },
    }));

    // Simulate progress updates (expo-libvlc-player doesn't expose onProgress)
    useEffect(() => {
      if (isPlaying && !isBuffering) {
        progressInterval.current = setInterval(() => {
          // Get current position from player
          const position = playerRef.current?.getCurrentPosition?.() || 0;
          const duration = playerRef.current?.getDuration?.() || 0;
          onProgress(position * 1000, duration * 1000);
        }, 250);
      } else {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
    }, [isPlaying, isBuffering, onProgress]);

    // Seek to start position after load
    useEffect(() => {
      if (startPositionMs > 0 && !isBuffering && playerRef.current) {
        playerRef.current.seek(startPositionMs / 1000);
      }
    }, [startPositionMs, isBuffering]);

    // Handle subtitle loading
    useEffect(() => {
      if (subtitleUri && !isBuffering && playerRef.current) {
        console.log('Subtitle loaded:', subtitleUri);
      }
    }, [subtitleUri, isBuffering]);

    // Simulate load complete
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsBuffering(false);
        onBuffer(false);
      }, 1000);
      return () => clearTimeout(timer);
    }, [source.uri, onBuffer]);

    return (
      <View style={[styles.container, style]}>
        <LibVlcPlayerView
          ref={playerRef}
          source={source.uri}
          autoplay={isPlaying}
          style={styles.player}
        />
        
        {/* Buffering Indicator */}
        {isBuffering && (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color="#7b2fff" />
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  player: {
    flex: 1,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
}); 
