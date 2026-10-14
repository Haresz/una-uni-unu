import type { Card, CardColor } from '../engine/types';

export type AnimationKind =
  | 'play'
  | 'draw'
  | 'deal'
  | 'burst'
  | 'wild';

export interface AnimationDescriptor {
  kind: AnimationKind;
  /** Anchor key the animation starts from (cards) or centres on (bursts). */
  from?: string | null;
  /** Anchor key the animation travels to. */
  to?: string | null;
  card?: Card | null;
  faceDown?: boolean;
  /** Short text for `burst` animations, e.g. "UNO!". */
  label?: string;
  tone?: 'info' | 'uno' | 'danger' | 'wild';
  color?: CardColor | null;
  /** Milliseconds before this item starts. */
  delay: number;
  /** Milliseconds the motion itself takes. */
  duration: number;
}

export interface AnimationItem extends AnimationDescriptor {
  id: number;
}
