import { useId } from 'react';
import type { Direction } from '../engine/types';

export interface DirectionIndicatorProps {
  direction: Direction;
  className?: string;
  mobile?: boolean;
}

/** Rotating arrow that shows which way play is travelling. */
export function DirectionIndicator({ direction, className = '', mobile = false }: DirectionIndicatorProps) {
  const markerId = `head-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const size = mobile ? 'h-28 w-28' : 'h-[180px] w-[180px]';

  return (
    <div className={`pointer-events-none flex items-center justify-center text-emerald-100/80 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className={`direction ${direction === -1 ? 'ccw' : ''} ${size}`}
        aria-label={direction === 1 ? 'Clockwise' : 'Counterclockwise'}
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 6 6"
            markerWidth="2.5"
            markerHeight="2.5"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
          </marker>
        </defs>
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path
            d="M 17.11 38.03 A 35 35 0 0 1 82.89 38.03"
            markerEnd={`url(#${markerId})`}
          />
          <path
            d="M 82.89 61.97 A 35 35 0 0 1 17.11 61.97"
            markerEnd={`url(#${markerId})`}
          />
        </g>
      </svg>
    </div>
  );
}
