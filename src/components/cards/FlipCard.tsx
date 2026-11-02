import type { Card as CardModel } from '../../engine/types';
import { DEAL_FLIP_DURATION } from '../../animation/timing';
import { CardView } from './Card';
import { CARD_SIZE_PX } from './cardTheme';

export interface FlipCardProps {
  card: CardModel;
  faceDown: boolean;
}

export function FlipCard({ card, faceDown }: FlipCardProps) {
  const { w, h } = CARD_SIZE_PX.md;

  return (
    <div
      className="relative"
      style={{ width: w, height: h, perspective: 800 }}
      data-face-down={faceDown}
      data-card-id={card.id}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: faceDown ? 'rotateY(0deg)' : 'rotateY(180deg)',
          transitionProperty: 'transform',
          transitionDuration: `${DEAL_FLIP_DURATION}ms`,
          transitionTimingFunction: 'ease-out',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
          aria-hidden={!faceDown}
        >
          <CardView faceDown size="md" />
        </div>
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          aria-hidden={faceDown}
        >
          <CardView card={card} size="md" />
        </div>
      </div>
    </div>
  );
}
