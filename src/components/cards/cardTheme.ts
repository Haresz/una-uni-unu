import type { CardColor } from '../../engine/types';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg';

export const CARD_SIZE_PX: Record<CardSize, { w: number; h: number }> = {
  xs: { w: 46, h: 69 },
  sm: { w: 46, h: 69 },
  md: { w: 64, h: 96 },
  lg: { w: 88, h: 132 },
};

export const CARD_COLOR_VAR: Record<CardColor, string> = {
  red: 'var(--card-red)',
  yellow: 'var(--card-yellow)',
  green: 'var(--card-green)',
  blue: 'var(--card-blue)',
};

export const COLOR_HEX: Record<CardColor, string> = {
  red: '#e0483c',
  yellow: '#f2b632',
  green: '#3fa34d',
  blue: '#2f6fdb',
};

export function colorVar(color: CardColor | null | undefined): string {
  return color ? CARD_COLOR_VAR[color] : 'var(--card-wild)';
}

export const COLOR_ORDER: readonly CardColor[] = ['red', 'yellow', 'green', 'blue'];

export const COLOR_LABEL: Record<CardColor, string> = {
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
};
