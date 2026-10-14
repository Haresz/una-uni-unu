import { describe, expect, it } from 'vitest';
import { createGame, reduce } from '../reducer';
import { chooseColor } from '../bot';
import { currentPlayer, getPlayableCards, isPlayable, isWild } from '../rules';
import type { GameAction, GameState } from '../types';

/** Player-agnostic policy used to simulate a whole round without any UI. */
function policy(state: GameState): GameAction | null {
  const player = currentPlayer(state);
  const playable = getPlayableCards(state, player);

  if (state.pendingDraw > 0) {
    const stack = playable.find((card) => card.kind === 'draw_two');
    return stack
      ? { type: 'PLAY_CARD', playerId: player.id, cardId: stack.id }
      : { type: 'DRAW_CARD', playerId: player.id };
  }

  if (state.drawnCardId !== null) {
    const drawn = player.hand.find((card) => card.id === state.drawnCardId);
    if (drawn && isPlayable(state, drawn) && !isWild(drawn)) {
      return { type: 'PLAY_CARD', playerId: player.id, cardId: drawn.id };
    }
    return { type: 'END_TURN', playerId: player.id };
  }

  if (playable.length === 0) {
    return { type: 'DRAW_CARD', playerId: player.id };
  }

  const card = playable[0]!;
  return isWild(card)
    ? {
        type: 'PLAY_CARD',
        playerId: player.id,
        cardId: card.id,
        chosenColor: chooseColor(player.hand),
      }
    : { type: 'PLAY_CARD', playerId: player.id, cardId: card.id };
}

function playFullRound(seed: number, botCount: number, stackDrawTwo: boolean) {
  let { state } = createGame({ botCount, stackDrawTwo, seed });
  let actions = 0;
  while (state.phase === 'playing' && actions < 5000) {
    const action = policy(state);
    if (!action) break;
    state = reduce(state, action).state;
    actions += 1;
  }
  return { state, actions };
}

function totalCards(state: GameState): number {
  return (
    state.players.reduce((sum, player) => sum + player.hand.length, 0) +
    state.drawPile.length +
    state.discardPile.length
  );
}

describe('full-round simulation', () => {
  it('always reaches a winner while conserving all 108 cards', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const bots of [1, 2, 3]) {
        for (const stack of [false, true]) {
          const { state, actions } = playFullRound(seed, bots, stack);
          expect(state.phase, `seed=${seed} bots=${bots} stack=${stack}`).toBe('roundOver');
          expect(state.winnerId, `seed=${seed} bots=${bots} stack=${stack}`).not.toBeNull();
          expect(totalCards(state)).toBe(108);
          expect(actions).toBeLessThan(5000);
        }
      }
    }
  });

  it('declares a winner who has an empty hand', () => {
    const { state } = playFullRound(7, 2, false);
    const winner = state.players.find((player) => player.id === state.winnerId);
    expect(winner?.hand).toHaveLength(0);
  });
});
