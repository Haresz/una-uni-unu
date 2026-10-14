/**
 * Original inline SVG glyphs used on the cards. Every glyph is drawn inside a
 * 100x150 viewBox and centred on (50, 75) so it can be dropped straight into
 * <CardFace />.
 */
import { COLOR_HEX } from './cardTheme';

interface GlyphProps {
  color?: string;
}

export function SkipIcon({ color = 'currentColor' }: GlyphProps) {
  return (
    <g transform="translate(50 75)" fill="none" stroke={color} strokeWidth={5.5}>
      <circle r={21} />
      <line x1={-15} y1={15} x2={15} y2={-15} strokeLinecap="round" />
    </g>
  );
}

export function ReverseIcon({ color = 'currentColor' }: GlyphProps) {
  return (
    <g transform="translate(50 75)">
      <path
        d="M6 -20 L20 -6 L6 8 L6 1 L-5 1 L-5 -13 L6 -13 Z"
        fill={color}
      />
      <path
        d="M-6 20 L-20 6 L-6 -8 L-6 -1 L5 -1 L5 13 L-6 13 Z"
        fill={color}
      />
    </g>
  );
}

export function DrawTwoIcon({ color = 'currentColor' }: GlyphProps) {
  return (
    <g transform="translate(50 75)">
      <rect
        x={-16}
        y={-18}
        width={22}
        height={32}
        rx={4}
        fill={color}
        stroke="white"
        strokeWidth={2}
        transform="rotate(-14)"
      />
      <rect
        x={-4}
        y={-12}
        width={22}
        height={32}
        rx={4}
        fill={color}
        stroke="white"
        strokeWidth={2}
        transform="rotate(12)"
      />
    </g>
  );
}

interface WildPieProps {
  r?: number;
  inner?: number;
}

/** Four-colour pie, the game's wild emblem. */
export function WildPie({ r = 21, inner = 6 }: WildPieProps) {
  return (
    <g transform="translate(50 75)">
      <path d={`M0 0 L0 ${-r} A ${r} ${r} 0 0 1 ${r} 0 Z`} fill={COLOR_HEX.red} />
      <path d={`M0 0 L${r} 0 A ${r} ${r} 0 0 1 0 ${r} Z`} fill={COLOR_HEX.yellow} />
      <path d={`M0 0 L0 ${r} A ${r} ${r} 0 0 1 ${-r} 0 Z`} fill={COLOR_HEX.green} />
      <path d={`M0 0 L${-r} 0 A ${r} ${r} 0 0 1 0 ${-r} Z`} fill={COLOR_HEX.blue} />
      <circle r={inner} fill="white" />
    </g>
  );
}

export function WildDrawFourIcon() {
  return (
    <g transform="translate(50 75)">
      <g transform="translate(0 -8) scale(0.82)">
        <WildPie r={21} inner={5} />
      </g>
      <text
        y={30}
        textAnchor="middle"
        fontSize={22}
        fontWeight={800}
        fill="white"
        paintOrder="stroke"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={3}
      >
        +4
      </text>
    </g>
  );
}
