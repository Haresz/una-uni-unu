import { useAudioStore } from '../store/audioStore';

/** Mute toggle + volume slider, pinned in the top-right corner. */
export function AudioControls({ className = '' }: { className?: string }) {
  const muted = useAudioStore((s) => s.muted);
  const volume = useAudioStore((s) => s.volume);
  const toggleMuted = useAudioStore((s) => s.toggleMuted);
  const setVolume = useAudioStore((s) => s.setVolume);

  const effective = muted ? 0 : volume;

  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1.5 text-white ring-1 ring-white/20 backdrop-blur ${className}`}
    >
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        aria-pressed={muted}
        className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/15"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            d="M4 9v6h4l5 4V5L8 9H4z"
            fill="currentColor"
          />
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
  );
}
