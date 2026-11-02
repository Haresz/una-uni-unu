import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Card as CardModel } from '../engine/types';
import { setAnchor } from '../animation/anchors';
import { CARD_SIZE_PX } from './cards/cardTheme';
import { CardView } from './cards/Card';

export interface PlayerHandProps {
  cards: CardModel[];
  playableIds?: ReadonlySet<string>;
  selectedId?: string | null;
  interactive?: boolean;
  onSelect?: (cardId: string) => void;
}

const CARD_WIDTH = CARD_SIZE_PX.md.w;
const HORIZONTAL_PADDING = 24;
const FALLBACK_WIDTH = 620;
const MAX_SPACING = 44;
const MAX_ROTATION = 34;
const SELECTED_LIFT = -30;
const DIP_FACTOR = 3.2;
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Bottom hand arranged in a fan. Cards are measured and spaced to fit the
 * available width with no horizontal scrolling.
 */
export function PlayerHand({
  cards,
  playableIds,
  selectedId = null,
  interactive = true,
  onSelect,
}: PlayerHandProps) {
  const count = cards.length;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const handRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    setAnchor('human', el);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setAvailableWidth(Math.max(0, el.getBoundingClientRect().width - HORIZONTAL_PADDING));
    };

    measure();

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    }
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const mid = (count - 1) / 2;
  const measuredWidth = availableWidth > 0 ? availableWidth : FALLBACK_WIDTH;
  const spacing = count <= 1
    ? 0
    : Math.max(0, Math.min(MAX_SPACING, (measuredWidth - CARD_WIDTH) / Math.max(count - 1, 1)));
  const spacingScale = Math.min(1, spacing / MAX_SPACING);
  const maxRotation = Math.min(MAX_ROTATION, count * 3.2 * spacingScale);

  return (
    <div
      ref={handRef}
      className="relative flex h-[120px] w-full items-end justify-center px-2 pb-[env(safe-area-inset-bottom,6px)] sm:h-[186px]"
    >
      <div className="relative flex h-full w-full items-end justify-center">
        {cards.map((card, index) => {
          const offset = count <= 1 ? 0 : index - mid;
          const normalized = mid > 0 ? offset / mid : 0;
          const rotation = count > 1 ? normalized * (maxRotation / 2) : 0;
          const x = count <= 1 ? 0 : offset * spacing;
          const dip = Math.abs(offset) * DIP_FACTOR * spacingScale;
          const playable = !playableIds || playableIds.has(card.id);
          const selected = selectedId === card.id;

          return (
            <div
              key={card.id}
              className="absolute bottom-0 left-1/2 transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(-50%) translateX(${x}px) translateY(${selected ? SELECTED_LIFT : dip}px) rotate(${rotation}deg)`,
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
