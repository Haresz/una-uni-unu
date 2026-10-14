import type { Direction } from '../engine/types';

export interface DirectionIndicatorProps {
  direction: Direction;
  className?: string;
}

/** Rotating arrow that shows which way play is travelling. */
export function DirectionIndicator({ direction, className = '' }: DirectionIndicatorProps) {
  return (
    <div className={`flex flex-col items-center gap-1 text-emerald-100/80 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-9"
        style={{ transform: direction === -1 ? 'scaleX(-1)' : undefined }}
        aria-hidden
      >
        <circle
          cx={24}
          cy={24}
          r={16}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeDasharray="5 6"
          opacity={0.45}
        />
        <path
          d="M24 7 A 17 17 0 0 1 41 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <path d="M41 24 L34.5 19 L34.5 29 Z" fill="currentColor" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
        {direction === 1 ? 'Clockwise' : 'Counter'}
      </span>
    </div>
  );
}
