import { create } from 'zustand';

interface PlayerState {
  positionMs: number;
  durationMs: number;
  isBuffering: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  setProgress: (positionMs: number, durationMs: number) => void;
  setBuffering: (isBuffering: boolean) => void;
  setPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  positionMs: 0,
  durationMs: 0,
  isBuffering: false,
  isPlaying: true,
  playbackSpeed: 1.0,

  setProgress: (positionMs, durationMs) => {
    set({ positionMs, durationMs });
  },

  setBuffering: (isBuffering) => {
    set({ isBuffering });
  },

  setPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
  },

  reset: () => {
    set({
      positionMs: 0,
      durationMs: 0,
      isBuffering: false,
      isPlaying: true,
      playbackSpeed: 1.0,
    });
  },
})); 
