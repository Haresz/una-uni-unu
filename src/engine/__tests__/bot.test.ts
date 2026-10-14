import { describe, expect, it } from 'vitest';
import { botRemembersUno, botWantsToCatch, chooseBotAction, chooseColor } from '../bot';
import type { Card, GameState } from '../types';
import { act, makeState, num, player, wild, type StateOverrides } from './helpers';

function botTurn(hand: Card[], extra: StateOverrides = {}): GameState {
  return makeState({
    currentPlayerIndex: 1,
    activeColor: 'red',
    discardPile: [num('red', 9)],
    players: [player('human', [num('red', 1)]), player('bot1', hand, true)],
    ...extra,
  });
}

describe('chooseBotAction', () => {
  it('returns null when it is the human turn', () => {
    const state = makeState({ currentPlayerIndex: 0 });
    expect(chooseBotAction(state)).toBeNull();
  });

  it('draws when it has no playable card', () => {
    const state = botTurn([num('blue', 8)]);
    expect(chooseBotAction(state)).toEqual({ type: 'DRAW_CARD', playerId: 'bot1' });
  });

  it('plays a matching number card', () => {
    const state = botTurn([num('red', 3), num('blue', 8)]);
    const action = chooseBotAction(state);
    expect(action && action.type === 'PLAY_CARD' ? action.cardId : null).toBe(
      state.players[1]!.hand[0]!.id,
    );
  });

  it('saves Wild cards and plays a number first', () => {
    const state = botTurn([num('red', 3), wild('wild')]);
    const action = chooseBotAction(state);
    expect(action && action.type === 'PLAY_CARD' ? action.cardId : null).toBe(
      state.players[1]!.hand[0]!.id,
    );
  });

  it('stacks a Draw Two while a chain is open', () => {
    const stack = act('draw_two', 'green');
    const state = botTurn([stack], { pendingDraw: 2, config: { stackDrawTwo: true } });
    const action = chooseBotAction(state);
    expect(action && action.type === 'PLAY_CARD' ? action.cardId : null).toBe(stack.id);
  });

  it('accepts the penalty when it cannot stack', () => {
    const state = botTurn([num('green', 2)], { pendingDraw: 2, config: { stackDrawTwo: true } });
    expect(chooseBotAction(state)).toEqual({ type: 'DRAW_CARD', playerId: 'bot1' });
  });

  it('chooses a colour based on the rest of its hand for a forced Wild', () => {
    const state = botTurn([wild('wild'), num('blue', 1)]);
    const action = chooseBotAction(state);
    expect(action?.type).toBe('PLAY_CARD');
    expect(action && action.type === 'PLAY_CARD' ? action.chosenColor : null).toBe('blue');
  });

  it('plays the drawn card when it is playable', () => {
    const drawn = num('red', 8);
    const state = botTurn([num('blue', 1), drawn], { drawnCardId: drawn.id });
    expect(chooseBotAction(state)).toEqual({
      type: 'PLAY_CARD',
      playerId: 'bot1',
      cardId: drawn.id,
    });
  });

  it('passes when the drawn card is not playable', () => {
    const drawn = num('blue', 8);
    const state = botTurn([num('blue', 1), drawn], { drawnCardId: drawn.id });
    expect(chooseBotAction(state)).toEqual({ type: 'END_TURN', playerId: 'bot1' });
  });
});

describe('chooseColor', () => {
  it('picks the most represented colour', () => {
    expect(chooseColor([num('green', 1), num('green', 2), num('red', 3)])).toBe('green');
  });

  it('defaults to red for an empty hand', () => {
    expect(chooseColor([])).toBe('red');
  });
});

describe('UNO helpers', () => {
  it('remembers UNO most of the time', () => {
    expect(botRemembersUno(0.9)).toBe(true);
    expect(botRemembersUno(0.05)).toBe(false);
  });

  it('catches opportunistically', () => {
    expect(botWantsToCatch(0.1)).toBe(true);
    expect(botWantsToCatch(0.9)).toBe(false);
  });
});
