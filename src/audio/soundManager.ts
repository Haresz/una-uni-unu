import { SOUND_FILES, type SoundName } from './sfx';

const BASE = import.meta.env.BASE_URL ?? '/';
const POOL_SIZE = 3;

interface Channel {
  pool: HTMLAudioElement[];
  index: number;
}

const channels = new Map<SoundName, Channel>();
let muted = false;
let volume = 0.7;
let unlocked = false;

function resolveUrl(file: string): string {
  const base = BASE.endsWith('/') ? BASE : `${BASE}/`;
  return `${base}${file}`;
}

function getChannel(name: SoundName): Channel {
  let channel = channels.get(name);
  if (!channel) {
    const url = resolveUrl(SOUND_FILES[name]);
    const pool = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = volume;
      return audio;
    });
    channel = { pool, index: 0 };
    channels.set(name, channel);
  }
  return channel;
}

/** Unlock audio playback; must be called from within a user gesture. */
export function unlockAudio(): void {
  if (unlocked || typeof window === 'undefined') return;
  unlocked = true;
  // Prime the browsers by playing a muted clip once.
  const channel = getChannel('click');
  const audio = channel.pool[0]!;
  audio.muted = true;
  void audio.play().then(
    () => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    },
    () => {
      audio.muted = false;
    },
  );
}

export function setMuted(next: boolean): void {
  muted = next;
}

export function setVolume(next: number): void {
  volume = Math.max(0, Math.min(1, next));
  for (const channel of channels.values()) {
    for (const audio of channel.pool) audio.volume = volume;
  }
}

/** Play a sound; overlaps round-robin through a small pool. Never throws. */
export function playSound(name: SoundName): void {
  if (muted || typeof window === 'undefined') return;
  try {
    const channel = getChannel(name);
    const audio = channel.pool[channel.index]!;
    channel.index = (channel.index + 1) % channel.pool.length;
    audio.currentTime = 0;
    audio.volume = volume;
    void audio.play().catch(() => {
      /* autoplay blocked or missing file — ignore */
    });
  } catch {
    /* no-op */
  }
}
