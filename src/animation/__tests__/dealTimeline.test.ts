import { describe, expect, it } from 'vitest';
import { buildDealTimeline } from '../dealTimeline';
import {
  CARD_FLY,
  DEAL_FLIP_DELAY,
  DEAL_FLIP_DURATION,
  DEAL_REVEAL_GAP,
  DEAL_STAGGER,
} from '../timing';
import type { GameEvent } from '../../engine/types';

const events: GameEvent[] = [
  { type: 'DEAL', playerId: 'human', cardId: 'a' },
  { type: 'DEAL', playerId: 'bot1', cardId: 'b' },
  { type: 'DEAL', playerId: 'human', cardId: 'c' },
  { type: 'DEAL', playerId: 'bot1', cardId: 'd' },
];

const landAt = (index: number) => index * DEAL_STAGGER + CARD_FLY;

describe('buildDealTimeline', () => {
  it('schedules round-robin landings and human flips', () => {
    const timeline = buildDealTimeline(events)!;

    expect(timeline.landings.map((landing) => landing.delay)).toEqual([0, 55, 110, 165]);
    expect(timeline.landings.map((landing) => landing.at)).toEqual([380, 435, 490, 545]);
    expect(timeline.landings[0]!.flipAt).toBe(landAt(0) + DEAL_FLIP_DELAY);
    expect(timeline.landings[1]!.flipAt).toBeNull();
    expect(timeline.landings[2]!.flipAt).toBe(landAt(2) + DEAL_FLIP_DELAY);
    expect(timeline.landings[3]!.flipAt).toBeNull();
  });

  it('waits for the last human flip before revealing the opening card', () => {
    const timeline = buildDealTimeline(events)!;
    const lastFlipEnd = landAt(2) + DEAL_FLIP_DELAY + DEAL_FLIP_DURATION;

    expect(timeline.lastDealEnd).toBe(landAt(3));
    expect(timeline.lastHumanFlipEnd).toBe(lastFlipEnd);
    expect(timeline.revealDelay).toBe(lastFlipEnd + DEAL_REVEAL_GAP);
  });

  it('returns null when the batch has no deals', () => {
    expect(buildDealTimeline([{ type: 'SKIP', playerId: 'human' }])).toBeNull();
  });
});
