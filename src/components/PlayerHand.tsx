import { useCallback } from 'react';
import type { Card as CardModel } from '../engine/types';
import { setAnchor } from '../animation/anchors';
import { CardView } from './cards/Card';

export interface PlayerHandProps {
  cards: CardModel[];
  playableIds?: ReadonlySet<string>;
  selectedId?: string | null;
  interactive?: boolean;
  onSelect?: (cardId: string) => void;
}

/**
 * Bottom hand arranged in a fan. Card positions are computed from the index so
 * the whole hand stays centred and readable; reflow is a plain CSS transition
 * during this static stage.
 */
export function PlayerHand({
  cards,
  playableIds,
  selectedId = null,
  interactive = true,
  onSelect,
}: PlayerHandProps) {
  const count = cards.length;
  const mid = (count - 1) / 2;
  const spacing = Math.min(46, 620 / Math.max(count, 1));
  const maxRotation = Math.min(38, count * 5);
  const handRef = useCallback((el: HTMLDivElement | null) => setAnchor('human', el), []);

  return (
    <div
      ref={handRef}
      className="relative flex h-[120px] w-full items-end justify-center overflow-x-auto overflow-y-visible px-2 pb-[env(safe-area-inset-bottom,6px)] sm:h-[186px] snap-x snap-mandatory"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="relative flex h-full min-w-max items-end justify-center">
        {cards.map((card, index) => {
          const offset = index - mid;
          const rotation = count > 1 ? (offset / mid) * (maxRotation / 2) : 0;
          const x = offset * spacing;
          const dip = Math.abs(offset) * 4;
          const playable = !playableIds || playableIds.has(card.id);
          const selected = selectedId === card.id;

          return (
            <div
              key={card.id}
              className="absolute bottom-0 snap-start transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(${x}px) translateY(${selected ? -30 : dip}px) rotate(${rotation}deg)`,
                transformOrigin: '50% 160%',
                zIndex: selected ? 999 : index,
              }}
            >
              <CardView
                card={card}
                size="md"
                interactive={interactive && playable}
                highlight={interactive && playable}
                dimmed={!playable}
                selected={selected}
                onClick={onSelect ? () => onSelect(card.id) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
