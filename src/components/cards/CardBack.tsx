import { useId } from 'react';
import { WildPie } from './icons';

export interface CardBackProps {
  className?: string;
}

/** The back of every card. Original dark emblem design. */
export function CardBack({ className }: CardBackProps) {
  const patternId = useId();
  const shineId = useId();

  return (
    <svg
      viewBox="0 0 100 150"
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="face-down card"
    >
      <defs>
        <pattern
          id={patternId}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="12" height="12" style={{ fill: 'var(--card-wild)' }} />
          <rect width="6" height="12" style={{ fill: 'var(--card-wild-2)' }} />
        </pattern>
        <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={0.18} />
          <stop offset="50%" stopColor="white" stopOpacity={0} />
          <stop offset="100%" stopColor="black" stopOpacity={0.25} />
        </linearGradient>
      </defs>

      <rect x={1} y={1} width={98} height={148} rx={13} fill={`url(#${patternId})`} />
      <rect x={1} y={1} width={98} height={148} rx={13} fill={`url(#${shineId})`} />
      <rect
        x={1}
        y={1}
        width={98}
        height={148}
        rx={13}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={2}
      />
      <rect
        x={8}
        y={8}
        width={84}
        height={134}
        rx={9}
        fill="none"
        stroke="white"
        strokeOpacity={0.35}
        strokeWidth={1.5}
      />

      <g transform="rotate(45 50 75)">
        <rect
          x={27}
          y={52}
          width={46}
          height={46}
          rx={9}
          fill="white"
          fillOpacity={0.95}
        />
      </g>
      <g transform="translate(50 75) scale(0.78) translate(-50 -75)">
        <WildPie r={20} inner={6} />
      </g>
    </svg>
  );
}
