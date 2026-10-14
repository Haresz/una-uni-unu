import type { CSSProperties, ReactNode } from 'react';
import type { Card as CardModel } from '../../engine/types';
import { CardBack } from './CardBack';
import { CardFace } from './CardFace';
import { CARD_SIZE_PX, type CardSize } from './cardTheme';

export interface CardViewProps {
  card?: CardModel | null;
  /** Force the back to show regardless of `card`. */
  faceDown?: boolean;
  size?: CardSize;
  className?: string;
  style?: CSSProperties;
  /** Marks the card as currently playable. */
  highlight?: boolean;
  /** Greys the card out (not playable right now). */
  dimmed?: boolean;
  /** Lifts the card up out of the hand. */
  selected?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

const baseShadow = 'shadow-[0_8px_18px_rgba(0,0,0,0.4)]';

export function CardView({
  card,
  faceDown = false,
  size = 'md',
  className = '',
  style,
  highlight = false,
  dimmed = false,
  selected = false,
  interactive = false,
  onClick,
  children,
}: CardViewProps) {
  const { w, h } = CARD_SIZE_PX[size];
  const showBack = faceDown || !card;

  const ring = highlight
    ? 'ring-4 ring-amber-300/90'
    : selected
      ? 'ring-4 ring-white/90'
      : 'ring-1 ring-black/20';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      aria-label={card ? undefined : 'face-down card'}
      className={[
        'relative select-none rounded-[14px] outline-none',
        'transition-transform duration-200 ease-out will-change-transform',
        interactive ? 'cursor-pointer hover:-translate-y-3 focus-visible:-translate-y-3' : '',
        dimmed ? 'opacity-45 saturate-50' : '',
        className,
      ].join(' ')}
      style={{ width: w, height: h, ...style }}
    >
      <div className={`h-full w-full overflow-hidden rounded-[14px] ${baseShadow} ${ring}`}>
        {showBack ? (
          <CardBack className="block h-full w-full" />
        ) : (
          <CardFace card={card} className="block h-full w-full" />
        )}
      </div>
      {children}
    </div>
  );
}
