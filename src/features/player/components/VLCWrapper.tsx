import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';

export interface VLCPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (positionMs: number) => void;
  setAudioTrack: (index: number) => void; // Limited support in standard web/mobile players
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
  ({ source, startPositionMs = 0, style, onProgress, onEnd, onError, onBuffer }, ref) => {
    
    // Initialize the player
    const player = useVideoPlayer(source.uri, (player) => {
      player.loop = false;
      player.play();
      if (startPositionMs > 0) {
        player.seekBy(startPositionMs / 1000);
      }
    });

    // Listen to status changes (buffering/loading)
    const { status, error } = useEvent(player, 'statusChange');
    const isBuffering = status === 'loading';

    // Handle Errors
    useEffect(() => {
      if (status === 'error' && error) onError(error);
    }, [status, error]);

    // Handle Buffering
    useEffect(() => {
      onBuffer(isBuffering);
    }, [isBuffering]);

    // Native Progress Updates (runs every time the time updates)
    useEvent(player, 'timeUpdate', (payload) => {
      // payload.currentTime and player.duration are in seconds
      onProgress(payload.currentTime * 1000, player.duration * 1000);
    });

    // Handle End of video
    useEvent(player, 'playToEnd', () => {
      onEnd();
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      play: () => player.play(),
      pause: () => player.pause(),
      seek: (positionMs: number) => player.seekBy(positionMs / 1000),
      setAudioTrack: (index: number) => {
        console.warn("Audio track switching not supported in expo-video yet");
      },
      setSubtitleTrack: (index: number) => {
        console.warn("Subtitle track switching not supported in expo-video yet");
      },
    }));

    return (
      <View style={[styles.container, style]}>
        <VideoView 
          player={player} 
          style={styles.player} 
          allowsFullscreen 
          allowsPictureInPicture 
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