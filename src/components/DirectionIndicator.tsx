import { useId } from 'react';
import type { CardColor, Direction } from '../engine/types';
import { COLOR_HEX } from './cards/cardTheme';

export interface DirectionIndicatorProps {
  direction: Direction;
  color: CardColor;
  className?: string;
  mobile?: boolean;
}

const ARCS: Record<'cw' | 'ccw', readonly [string, string]> = {
  cw: [
    'M 17.11 38.03 A 35 35 0 0 1 82.89 38.03',
    'M 82.89 61.97 A 35 35 0 0 1 17.11 61.97',
  ],
  ccw: [
    'M 82.89 38.03 A 35 35 0 0 0 17.11 38.03',
    'M 17.11 61.97 A 35 35 0 0 0 82.89 61.97',
  ],
};

/** Rotating arrow that shows which way play is travelling. */
export function DirectionIndicator({
  direction,
  color,
  className = '',
  mobile = false,
}: DirectionIndicatorProps) {
  const markerId = `head-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const size = mobile ? 'h-32 w-32' : 'h-[200px] w-[200px]';
  const clockwise = direction === 1;
  const [upperArc, lowerArc] = ARCS[clockwise ? 'cw' : 'ccw'];

  return (
    <div
      className={`pointer-events-none flex items-center justify-center transition-colors duration-300 ${className}`}
      style={{ color: COLOR_HEX[color] }}
    >
      <svg
        viewBox="0 0 100 100"
        className={`direction ${clockwise ? '' : 'ccw'} ${size}`}
        aria-label={clockwise ? 'Clockwise' : 'Counterclockwise'}
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
          <path d={upperArc} markerEnd={`url(#${markerId})`} />
          <path d={lowerArc} markerEnd={`url(#${markerId})`} />
        </g>
      </svg>
    </div>
  );
}
