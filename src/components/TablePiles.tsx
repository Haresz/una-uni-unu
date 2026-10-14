import { useCallback } from 'react';
import type { Card as CardModel, CardColor } from '../engine/types';
import { setAnchor } from '../animation/anchors';
import { CARD_COLOR_VAR } from './cards/cardTheme';
import { CardView } from './cards/Card';

export interface TablePilesProps {
  drawCount: number;
  /** Discard stack, bottom first, top last. */
  discardStack: CardModel[];
  /** Colour the discard pile currently glows with (chosen wild colour). */
  activeColor: CardColor;
  /** Optional stack chain counter shown over the draw pile. */
  pendingDraw?: number;
}

export function TablePiles({ drawCount, discardStack, activeColor, pendingDraw = 0 }: TablePilesProps) {
  const top = discardStack[discardStack.length - 1] ?? null;
  const behind = discardStack.slice(0, -1).slice(-2);
  const glow = CARD_COLOR_VAR[activeColor];

  const drawRef = useCallback((el: HTMLDivElement | null) => setAnchor('draw', el), []);
  const discardRef = useCallback((el: HTMLDivElement | null) => setAnchor('discard', el), []);

  return (
    <div className="flex items-center justify-center gap-10 sm:gap-16">
      {/* Draw pile */}
      <div className="flex flex-col items-center gap-2">
        <div ref={drawRef} className="relative h-[104px] w-[70px]">
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 opacity-70">
            <CardView faceDown />
          </div>
          <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 opacity-90">
            <CardView faceDown />
          </div>
          <div className="absolute inset-0">
            <CardView faceDown />
          </div>
          {drawCount > 0 && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white ring-1 ring-white/20">
              {drawCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
          Draw
        </span>
      </div>

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-2">
        <div ref={discardRef} className="relative h-[96px] w-[64px]">
          <div
            className="absolute -inset-3 rounded-3xl blur-xl transition-colors duration-500"
            style={{ backgroundColor: glow, opacity: 0.5 }}
            aria-hidden
          />
          {behind.map((card, index) => (
            <div
              key={card.id}
              className="absolute inset-0"
              style={{ transform: `rotate(${(index - 1) * 7}deg)` }}
            >
              <CardView card={card} dimmed />
            </div>
          ))}
          {top && (
            <div className="absolute inset-0">
              <CardView card={top} highlight />
            </div>
          )}
          {pendingDraw > 0 && (
            <span className="absolute -top-3 -right-3 z-10 rounded-full bg-red-500 px-2.5 py-1 text-sm font-black text-white shadow-lg ring-2 ring-white/70">
              +{pendingDraw}
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
          Discard
        </span>
      </div>
    </div>
  );
}
