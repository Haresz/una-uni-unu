import { describe, expect, it } from 'vitest';
import { cardMatchesTop, isPlayable, mostCommonColor } from '../rules';
import { act, makeState, num, player, wild } from './helpers';

describe('cardMatchesTop', () => {
  const state = makeState({ activeColor: 'red', discardPile: [num('red', 9)] });

  it('matches on colour', () => {
    expect(cardMatchesTop(state, num('red', 3))).toBe(true);
  });

  it('matches a number of the same value on another colour', () => {
    expect(cardMatchesTop(state, num('blue', 9))).toBe(true);
  });

  it('matches an action of the same symbol on another colour', () => {
    const skipTop = makeState({ activeColor: 'green', discardPile: [act('skip', 'green')] });
    expect(cardMatchesTop(skipTop, act('skip', 'blue'))).toBe(true);
    expect(cardMatchesTop(skipTop, act('reverse', 'blue'))).toBe(false);
  });

  it('rejects mismatched number cards', () => {
    expect(cardMatchesTop(state, num('blue', 4))).toBe(false);
  });

  it('always accepts wilds', () => {
    expect(cardMatchesTop(state, wild('wild'))).toBe(true);
    expect(cardMatchesTop(state, wild('wild_draw_four'))).toBe(true);
  });

  it('uses the chosen colour when the top card is a wild', () => {
    const wildTop = makeState({ activeColor: 'blue', discardPile: [wild('wild')] });
    expect(cardMatchesTop(wildTop, num('blue', 2))).toBe(true);
    expect(cardMatchesTop(wildTop, num('green', 2))).toBe(false);
  });
});

describe('isPlayable', () => {
  it('restricts the player to the drawn card after drawing', () => {
    const drawn = num('red', 5);
    const other = num('red', 6);
    const state = makeState({
      activeColor: 'red',
      discardPile: [num('red', 9)],
      drawnCardId: drawn.id,
      players: [player('human', [drawn, other]), player('bot1', [], true)],
    });
    expect(isPlayable(state, drawn)).toBe(true);
    expect(isPlayable(state, other)).toBe(false);
  });

  it('only allows Draw Two while a stack chain is open', () => {
    const stack = act('draw_two', 'blue');
    const number = num('red', 2);
    const state = makeState({
      activeColor: 'red',
      pendingDraw: 2,
      config: { stackDrawTwo: true },
      players: [player('human', [stack, number]), player('bot1', [], true)],
    });
    expect(isPlayable(state, stack)).toBe(true);
    expect(isPlayable(state, number)).toBe(false);
  });
});

describe('mostCommonColor', () => {
  it('returns the most represented colour in hand', () => {
    expect(
      mostCommonColor([num('blue', 1), num('blue', 2), num('red', 3), wild()]),
    ).toBe('blue');
  });
});
