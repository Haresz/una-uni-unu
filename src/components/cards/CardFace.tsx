import { useId } from 'react';
import type { Card } from '../../engine/types';
import { colorVar } from './cardTheme';
import { DrawTwoIcon, ReverseIcon, SkipIcon, WildDrawFourIcon, WildPie } from './icons';

const FONT = "'Baloo 2', system-ui, -apple-system, sans-serif";

function centerGlyph(card: Card) {
  switch (card.kind) {
    case 'number':
      return (
        <text
          x={50}
          y={78}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT}
          fontSize={48}
          fontWeight={800}
          fill="currentColor"
        >
          {card.value}
        </text>
      );
    case 'skip':
      return <SkipIcon />;
    case 'reverse':
      return <ReverseIcon />;
    case 'draw_two':
      return <DrawTwoIcon />;
    case 'wild':
      return <WildPie />;
    case 'wild_draw_four':
      return <WildDrawFourIcon />;
  }
}

function cornerLabel(card: Card): string {
  switch (card.kind) {
    case 'number':
      return String(card.value);
    case 'skip':
      return 'S';
    case 'reverse':
      return 'R';
    case 'draw_two':
      return '+2';
    case 'wild':
      return 'W';
    case 'wild_draw_four':
      return '+4';
  }
}

export interface CardFaceProps {
  card: Card;
  className?: string;
}

/**
 * The front of a card. Colour is driven entirely by CSS variables so the whole
 * deck can be re-themed in one place.
 */
export function CardFace({ card, className }: CardFaceProps) {
  const color = colorVar(card.color);
  const label = cornerLabel(card);
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 100 150"
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label={cardLabelText(card)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={0.16} />
          <stop offset="45%" stopColor="white" stopOpacity={0} />
          <stop offset="100%" stopColor="black" stopOpacity={0.18} />
        </linearGradient>
      </defs>

      <rect x={1} y={1} width={98} height={148} rx={13} style={{ fill: color }} />
      <rect x={1} y={1} width={98} height={148} rx={13} fill={`url(#${gradientId})`} />
      <rect
        x={1}
        y={1}
        width={98}
        height={148}
        rx={13}
        fill="none"
        stroke="rgba(0,0,0,0.28)"
        strokeWidth={2}
      />
      {/* Inner keyline */}
      <rect
        x={7.5}
        y={7.5}
        width={85}
        height={135}
        rx={9}
        fill="none"
        stroke="white"
        strokeOpacity={0.9}
        strokeWidth={2.5}
      />

      {/* Central medallion */}
      <ellipse cx={50} cy={75} rx={37} ry={43} fill="white" opacity={0.96} />
      <g style={{ color }}>{centerGlyph(card)}</g>

      {/* Corner labels */}
      <text
        x={16}
        y={22}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={16}
        fontWeight={800}
        fill="white"
        opacity={0.95}
      >
        {label}
      </text>
      <text
        x={84}
        y={132}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={16}
        fontWeight={800}
        fill="white"
        opacity={0.95}
        transform="rotate(180 84 132)"
      >
        {label}
      </text>
    </svg>
  );
}

function cardLabelText(card: Card): string {
  const color = card.color ? `${card.color} ` : '';
  switch (card.kind) {
    case 'number':
      return `${color}${card.value}`;
    case 'skip':
      return `${color}skip`;
    case 'reverse':
      return `${color}reverse`;
    case 'draw_two':
      return `${color}draw two`;
    case 'wild':
      return 'wild';
    case 'wild_draw_four':
      return 'wild draw four';
  }
}
