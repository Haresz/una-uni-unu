import { create } from 'zustand';
import { setMuted as applyMuted, setVolume as applyVolume } from '../audio/soundManager';

const STORAGE_KEY = 'una-uni-unu:audio';

interface StoredSettings {
  muted: boolean;
  volume: number;
}

function loadSettings(): StoredSettings {
  const fallback: StoredSettings = { muted: false, volume: 0.7 };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : fallback.muted,
      volume: typeof parsed.volume === 'number' ? parsed.volume : fallback.volume,
    };
  } catch {
    return fallback;
  }
}

function persist(settings: StoredSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable — ignore */
  }
}

interface AudioStore {
  muted: boolean;
  volume: number;
  toggleMuted: () => void;
  setVolume: (volume: number) => void;
}

const initial = loadSettings();
applyMuted(initial.muted);
applyVolume(initial.volume);

export const useAudioStore = create<AudioStore>((set, get) => ({
  muted: initial.muted,
  volume: initial.volume,

  toggleMuted: () => {
    const muted = !get().muted;
    applyMuted(muted);
    persist({ muted, volume: get().volume });
    set({ muted });
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    applyVolume(clamped);
    persist({ muted: get().muted, volume: clamped });
    set({ volume: clamped });
  },
}));
