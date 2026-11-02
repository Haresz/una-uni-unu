import type { GameEvent } from '../engine/types';
import {
  CARD_FLY,
  DEAL_FLIP_DELAY,
  DEAL_FLIP_DURATION,
  DEAL_REVEAL_GAP,
  DEAL_STAGGER,
} from './timing';

export interface DealLanding {
  playerId: string;
  cardId: string;
  delay: number;
  at: number;
  flipAt: number | null;
}

export interface DealTimelineStep {
  kind: 'land' | 'flip';
  playerId: string;
  cardId: string;
  at: number;
}

export interface DealTimeline {
  landings: DealLanding[];
  steps: DealTimelineStep[];
  lastDealEnd: number;
  lastHumanFlipEnd: number;
  revealDelay: number;
}

export function buildDealTimeline(events: readonly GameEvent[]): DealTimeline | null {
  const deals = events.filter(
    (event): event is Extract<GameEvent, { type: 'DEAL' }> => event.type === 'DEAL',
  );
  if (deals.length === 0) return null;

  const landings = deals.map((event, index): DealLanding => {
    const delay = index * DEAL_STAGGER;
    const at = delay + CARD_FLY;
    return {
      playerId: event.playerId,
      cardId: event.cardId,
      delay,
      at,
      flipAt: event.playerId === 'human' ? at + DEAL_FLIP_DELAY : null,
    };
  });

  const lastDealEnd = Math.max(...landings.map((landing) => landing.at));
  const humanFlips = landings.filter((landing) => landing.flipAt !== null);
  const lastHumanFlipEnd = humanFlips.length > 0
    ? Math.max(...humanFlips.map((landing) => landing.flipAt! + DEAL_FLIP_DURATION))
    : 0;
  const revealDelay = Math.max(lastDealEnd, lastHumanFlipEnd) + DEAL_REVEAL_GAP;

  const steps = landings
    .flatMap((landing): DealTimelineStep[] => {
      const out: DealTimelineStep[] = [
        { kind: 'land', playerId: landing.playerId, cardId: landing.cardId, at: landing.at },
      ];
      if (landing.flipAt !== null) {
        out.push({
          kind: 'flip',
          playerId: landing.playerId,
          cardId: landing.cardId,
          at: landing.flipAt,
        });
      }
      return out;
    })
    .sort((a, b) => a.at - b.at);

  return { landings, steps, lastDealEnd, lastHumanFlipEnd, revealDelay };
}
