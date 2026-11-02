import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/audioStore';

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      {muted ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7M18.8 6.2a8 8 0 0 1 0 11.6"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

/** Mute toggle + volume slider, pinned in the top-right corner. */
export function AudioControls({ className = '' }: { className?: string }) {
  const muted = useAudioStore((s) => s.muted);
  const volume = useAudioStore((s) => s.volume);
  const toggleMuted = useAudioStore((s) => s.toggleMuted);
  const setVolume = useAudioStore((s) => s.setVolume);

  const effective = muted ? 0 : volume;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="hidden items-center gap-2 rounded-full bg-black/40 px-2.5 py-1.5 text-white ring-1 ring-white/20 backdrop-blur sm:flex">
        <button
          type="button"
          onClick={toggleMuted}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          aria-pressed={muted}
          className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/15"
        >
          <SpeakerIcon muted={muted} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={effective}
          onChange={(event) => setVolume(Number(event.target.value))}
          disabled={muted}
          aria-label="Volume"
          className="h-1 w-20 cursor-pointer accent-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>

      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Sound settings"
          aria-expanded={open}
          aria-haspopup="dialog"
          className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/60"
        >
          <SpeakerIcon muted={muted} />
        </button>
        {open ? (
          <div
            role="dialog"
            aria-label="Volume"
            className="absolute right-0 top-full z-[70] mt-2 flex items-center gap-2 rounded-full bg-black/80 px-2.5 py-1.5 text-white ring-1 ring-white/25 shadow-xl backdrop-blur"
          >
            <button
              type="button"
              onClick={toggleMuted}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              aria-pressed={muted}
              className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-white/15"
            >
              <SpeakerIcon muted={muted} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effective}
              onChange={(event) => setVolume(Number(event.target.value))}
              disabled={muted}
              aria-label="Volume"
              className="h-1 w-24 cursor-pointer accent-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
