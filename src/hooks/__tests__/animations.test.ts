import { describe, expect, it } from 'vitest';
import { seatAnchor } from '../../animation/anchors';
import { buildAnimations } from '../useAnimationQueue';
import type { Card, GameEvent } from '../../engine/types';

const redFive: Card = { id: 'c-red-5', kind: 'number', color: 'red', value: 5 };

describe('buildAnimations', () => {
  it('flies a played card from the seat to the discard pile', () => {
    const events: GameEvent[] = [
      { type: 'PLAY_CARD', playerId: 'bot1', cardId: redFive.id, card: redFive, chosenColor: null },
    ];
    const animations = buildAnimations(events);
    expect(animations).toHaveLength(1);
    expect(animations[0]).toMatchObject({
      kind: 'play',
      from: seatAnchor('bot1'),
      to: 'discard',
      card: redFive,
    });
  });

  it('shows the human draw face up but hides bot draws', () => {
    const humanDraw: GameEvent[] = [
      { type: 'DRAW_CARD', playerId: 'human', cardId: redFive.id, card: redFive, cause: 'voluntary' },
    ];
    const botDraw: GameEvent[] = [
      { type: 'DRAW_CARD', playerId: 'bot1', cardId: redFive.id, card: redFive, cause: 'voluntary' },
    ];
    expect(buildAnimations(humanDraw)[0]).toMatchObject({ kind: 'draw', faceDown: false, card: redFive });
    expect(buildAnimations(botDraw)[0]).toMatchObject({ kind: 'draw', faceDown: true });
  });

  it('emits one staggered card per penalty draw', () => {
    const events: GameEvent[] = [
      { type: 'DRAW_PENALTY', sourceId: 'bot1', targetId: 'human', count: 2, kind: 'draw_two', pending: false },
    ];
    const animations = buildAnimations(events);
    expect(animations).toHaveLength(2);
    expect(animations.map((a) => a.delay)).toEqual([0, 130]);
    expect(animations.every((a) => a.to === seatAnchor('human'))).toBe(true);
  });

  it('stagger the opening deal in order', () => {
    const events: GameEvent[] = [
      { type: 'DEAL', playerId: 'human', cardId: 'a' },
      { type: 'DEAL', playerId: 'bot1', cardId: 'b' },
      { type: 'DEAL', playerId: 'human', cardId: 'c' },
    ];
    const animations = buildAnimations(events);
    expect(animations.map((a) => a.delay)).toEqual([0, 55, 110]);
    expect(animations.every((a) => a.faceDown)).toBe(true);
  });

  it('turns call-outs into bursts and ignores bookkeeping events', () => {
    const events: GameEvent[] = [
      { type: 'UNO_CALLED', playerId: 'bot1' },
      { type: 'TURN_CHANGED', currentPlayerId: 'human', direction: 1 },
    ];
    const animations = buildAnimations(events);
    expect(animations).toHaveLength(1);
    expect(animations[0]).toMatchObject({ kind: 'burst', label: 'UNO!', from: seatAnchor('bot1') });
  });
});
