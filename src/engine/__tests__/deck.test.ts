import { describe, expect, it } from 'vitest';
import { COLORS, createDeck, FULL_DECK_SIZE, shuffleDeck } from '../deck';

describe('deck composition', () => {
  it('has exactly 108 cards', () => {
    expect(createDeck()).toHaveLength(FULL_DECK_SIZE);
  });

  it('gives every card a unique id', () => {
    const ids = createDeck().map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('builds 25 cards per colour with correct kind/value counts', () => {
    const deck = createDeck();
    for (const color of COLORS) {
      const ofColor = deck.filter((card) => card.color === color);
      expect(ofColor).toHaveLength(25);

      const zeros = ofColor.filter((card) => card.kind === 'number' && card.value === 0);
      expect(zeros).toHaveLength(1);

      for (let value = 1; value <= 9; value++) {
        const matches = ofColor.filter(
          (card) => card.kind === 'number' && card.value === value,
        );
        expect(matches).toHaveLength(2);
      }

      for (const kind of ['skip', 'reverse', 'draw_two'] as const) {
        expect(ofColor.filter((card) => card.kind === kind)).toHaveLength(2);
      }
    }
  });

  it('has 4 Wild and 4 Wild Draw Four cards', () => {
    const deck = createDeck();
    expect(deck.filter((card) => card.kind === 'wild')).toHaveLength(4);
    expect(deck.filter((card) => card.kind === 'wild_draw_four')).toHaveLength(4);
    expect(deck.filter((card) => card.color === null)).toHaveLength(8);
  });
});

describe('shuffleDeck', () => {
  it('preserves the exact multiset of cards', () => {
    const deck = createDeck();
    const { deck: shuffled } = shuffleDeck(deck, 12345);
    const before = deck.map((card) => card.id).sort();
    const after = shuffled.map((card) => card.id).sort();
    expect(after).toEqual(before);
  });

  it('produces a different order for a typical seed', () => {
    const deck = createDeck();
    const { deck: shuffled } = shuffleDeck(deck, 999);
    const sameOrder = deck.every((card, index) => card.id === shuffled[index]!.id);
    expect(sameOrder).toBe(false);
  });

  it('is deterministic for the same seed', () => {
    const a = shuffleDeck(createDeck(), 42).deck.map((card) => card.id);
    const b = shuffleDeck(createDeck(), 42).deck.map((card) => card.id);
    expect(a).toEqual(b);
  });
});
