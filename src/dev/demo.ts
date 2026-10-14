/**
 * Static demo fixture used while the UI is being built. It produces a plausible
 * mid-game state so every visual component can be reviewed without the engine
 * being wired up yet.
 */
import { createDeck } from '../engine';
import type { Card, CardColor, CardKind, GameState } from '../engine/types';

function take(
  pool: Card[],
  predicate: (card: Card) => boolean,
  count = 1,
): Card[] {
  const taken: Card[] = [];
  for (let i = pool.length - 1; i >= 0 && taken.length < count; i--) {
    const card = pool[i]!;
    if (predicate(card)) {
      taken.push(card);
      pool.splice(i, 1);
    }
  }
  return taken.reverse();
}

const byNumber = (color: CardColor, value: number) => (card: Card) =>
  card.kind === 'number' && card.color === color && card.value === value;
const byKind = (kind: CardKind, color?: CardColor) => (card: Card) =>
  card.kind === kind && (color === undefined || card.color === color);

export function makeDemoState(botCount = 2): GameState {
  const pool = createDeck();

  const humanHand: Card[] = [
    ...take(pool, byNumber('red', 3)),
    ...take(pool, byKind('skip', 'red')),
    ...take(pool, byNumber('blue', 7)),
    ...take(pool, byNumber('green', 1)),
    ...take(pool, byKind('wild')),
    ...take(pool, byKind('reverse', 'yellow')),
    ...take(pool, byNumber('red', 0)),
  ];

  const bots = Array.from({ length: botCount }, (_, index) => {
    const size = [5, 8, 3][index] ?? 6;
    return {
      id: `bot${index + 1}`,
      name: `Bot ${index + 1}`,
      isBot: true as const,
      hand: pool.splice(pool.length - size, size),
      hasCalledUno: false,
    };
  });

  const discardStack: Card[] = [
    ...take(pool, byNumber('blue', 2)),
    ...take(pool, byNumber('green', 8)),
    ...take(pool, byNumber('red', 5)),
  ];

  return {
    phase: 'playing',
    config: { botCount, stackDrawTwo: false, seed: 1 },
    rng: 1,
    players: [
      { id: 'human', name: 'You', isBot: false, hand: humanHand, hasCalledUno: false },
      ...bots,
    ],
    drawPile: pool,
    discardPile: discardStack,
    currentPlayerIndex: 0,
    direction: 1,
    activeColor: 'red',
    pendingDraw: 0,
    drawnCardId: null,
    unoPending: null,
    winnerId: null,
    turnCount: 12,
  };
}
