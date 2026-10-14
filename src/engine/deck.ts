import type { Card, CardColor, CardKind } from './types';
import { seedFromNumber, shuffle, type RngState } from './prng';

export const COLORS: readonly CardColor[] = ['red', 'yellow', 'green', 'blue'];

/**
 * Build the full 108-card deck.
 *
 * Per colour (25 cards): one 0, two of each 1-9, two Skip, two Reverse, two
 * Draw Two. That is 100 coloured cards. Plus 4 Wild and 4 Wild Draw Four.
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];
  let counter = 0;

  const make = (
    kind: CardKind,
    color: CardColor | null,
    value: number | null,
  ): Card => ({
    id: `c${counter++}`,
    kind,
    color,
    value,
  });

  for (const color of COLORS) {
    cards.push(make('number', color, 0));
    for (let value = 1; value <= 9; value++) {
      cards.push(make('number', color, value));
      cards.push(make('number', color, value));
    }
    for (const kind of ['skip', 'reverse', 'draw_two'] as const) {
      cards.push(make(kind, color, null));
      cards.push(make(kind, color, null));
    }
  }

  for (let i = 0; i < 4; i++) {
    cards.push(make('wild', null, null));
    cards.push(make('wild_draw_four', null, null));
  }

  return cards;
}

export const FULL_DECK_SIZE = 108;

/** Shuffle a deck of cards using the supplied PRNG state. */
export function shuffleDeck(
  deck: readonly Card[],
  rng: RngState,
): { deck: Card[]; rng: RngState } {
  const { result, state } = shuffle(deck, seedFromNumber(rng));
  return { deck: result, rng: state };
}

export interface DealResult {
  hands: Card[][];
  deck: Card[];
  rng: RngState;
  events: { playerId: string; cardId: string }[];
}

/**
 * Deal `cardsPerPlayer` to each player in round-robin order (one at a time, as
 * in a real table) so the UI can stagger the animation. The deck is consumed
 * from the end (top).
 */
export function dealHands(
  deck: readonly Card[],
  playerIds: readonly string[],
  cardsPerPlayer: number,
  rng: RngState,
): DealResult {
  const remaining = deck.slice();
  const hands: Card[][] = playerIds.map(() => []);
  const events: { playerId: string; cardId: string }[] = [];

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (const playerId of playerIds) {
      const card = remaining.pop();
      if (!card) break;
      const index = playerIds.indexOf(playerId);
      hands[index]!.push(card);
      events.push({ playerId, cardId: card.id });
    }
  }

  return { hands, deck: remaining, rng, events };
}
