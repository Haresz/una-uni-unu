import { describe, expect, it } from 'vitest';
import { createGame, reduce } from '../reducer';
import type { CardKind, GameState } from '../types';
import { act, eventTypes, makeState, makeThreePlayerState, num, player, wild } from './helpers';

function top(state: GameState) {
  return state.discardPile[state.discardPile.length - 1]!;
}

function findSeedForOpening(kind: CardKind, botCount = 1): number {
  for (let seed = 0; seed < 50_000; seed++) {
    const { state } = createGame({ botCount, stackDrawTwo: false, seed });
    if (top(state).kind === kind) return seed;
  }
  throw new Error(`no seed found for opening ${kind}`);
}

describe('START_GAME', () => {
  it('deals 7 cards to every player and opens a non-wild card', () => {
    const { state, events } = createGame({ botCount: 2, stackDrawTwo: false, seed: 7 });
    expect(state.phase).toBe('playing');
    expect(state.players).toHaveLength(3);
    for (const p of state.players) {
      expect(p.hand).toHaveLength(7);
    }
    expect(state.discardPile).toHaveLength(1);
    expect(top(state).color).not.toBeNull();

    const dealEvents = events.filter((event) => event.type === 'DEAL');
    expect(dealEvents).toHaveLength(21);
    expect(events.some((event) => event.type === 'REVEAL_INITIAL')).toBe(true);
  });

  it('conserves all 108 cards between hands, draw pile and discard', () => {
    const { state } = createGame({ botCount: 3, stackDrawTwo: false, seed: 11 });
    const total =
      state.players.reduce((sum, p) => sum + p.hand.length, 0) +
      state.drawPile.length +
      state.discardPile.length;
    expect(total).toBe(108);
  });

  it('applies a Skip opening by skipping the first player', () => {
    const seed = findSeedForOpening('skip');
    const { state, events } = createGame({ botCount: 2, stackDrawTwo: false, seed });
    expect(state.currentPlayerIndex).toBe(1);
    const skip = events.find((event) => event.type === 'SKIP');
    expect(skip && skip.type === 'SKIP' ? skip.playerId : null).toBe('human');
  });

  it('applies a Reverse opening by reversing direction', () => {
    const seed = findSeedForOpening('reverse', 2);
    const { state } = createGame({ botCount: 2, stackDrawTwo: false, seed });
    expect(state.direction).toBe(-1);
    expect(state.currentPlayerIndex).toBe(state.players.length - 1);
  });

  it('applies a Draw Two opening to the first player', () => {
    const seed = findSeedForOpening('draw_two');
    const { state, events } = createGame({ botCount: 1, stackDrawTwo: false, seed });
    expect(state.players[0]!.hand).toHaveLength(9);
    expect(state.currentPlayerIndex).toBe(1);
    expect(events.filter((event) => event.type === 'DRAW_CARD')).toHaveLength(2);
  });
});

describe('PLAY_CARD validation', () => {
  it('ignores an illegal card and keeps the same state', () => {
    const hand = [num('blue', 4)];
    const state = makeState({ players: [player('human', hand), player('bot1', [], true)] });
    const result = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: hand[0]!.id });
    expect(result.events).toHaveLength(0);
    expect(result.state).toBe(state);
  });

  it('rejects a Wild played without a chosen colour', () => {
    const w = wild('wild');
    const state = makeState({ players: [player('human', [w]), player('bot1', [], true)] });
    const result = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: w.id });
    expect(result.events).toHaveLength(0);
  });

  it('rejects playing out of turn', () => {
    const hand = [num('red', 4)];
    const state = makeState({ players: [player('human', hand), player('bot1', [], true)] });
    const result = reduce(state, { type: 'PLAY_CARD', playerId: 'bot1', cardId: hand[0]!.id });
    expect(result.events).toHaveLength(0);
  });
});

describe('number cards', () => {
  it('advances the turn to the next player', () => {
    const card = num('red', 5);
    const state = makeState({
      players: [player('human', [card, num('red', 1)]), player('bot1', [], true)],
    });
    const { state: next, events } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: card.id,
    });
    expect(top(next).id).toBe(card.id);
    expect(next.currentPlayerIndex).toBe(1);
    expect(eventTypes(events)).toContain('PLAY_CARD');
    expect(eventTypes(events)).toContain('TURN_CHANGED');
  });
});

describe('Skip', () => {
  it('skips the next player (3 seats)', () => {
    const skip = act('skip', 'red');
    const state = makeThreePlayerState({
      players: [
        player('human', [skip, num('red', 1)]),
        player('bot1', [], true),
        player('bot2', [], true),
      ],
    });
    const { state: next, events } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: skip.id,
    });
    expect(next.currentPlayerIndex).toBe(2);
    const skipEvent = events.find((event) => event.type === 'SKIP');
    expect(skipEvent && skipEvent.type === 'SKIP' ? skipEvent.playerId : null).toBe('bot1');
  });

  it('acts like a skip with two players (you play again)', () => {
    const skip = act('skip', 'red');
    const state = makeState({
      players: [player('human', [skip, num('red', 1)]), player('bot1', [], true)],
    });
    const { state: next } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: skip.id,
    });
    expect(next.currentPlayerIndex).toBe(0);
  });
});

describe('Reverse', () => {
  it('flips direction and moves to the previous player (3 seats)', () => {
    const reverse = act('reverse', 'red');
    const state = makeThreePlayerState({
      players: [
        player('human', [reverse, num('red', 1)]),
        player('bot1', [], true),
        player('bot2', [], true),
      ],
    });
    const { state: next, events } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: reverse.id,
    });
    expect(next.direction).toBe(-1);
    expect(next.currentPlayerIndex).toBe(2);
    expect(eventTypes(events)).toContain('REVERSE');
  });

  it('acts like a skip with two players', () => {
    const reverse = act('reverse', 'red');
    const state = makeState({
      players: [player('human', [reverse, num('red', 1)]), player('bot1', [], true)],
    });
    const { state: next } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: reverse.id,
    });
    expect(next.direction).toBe(1);
    expect(next.currentPlayerIndex).toBe(0);
  });
});

describe('Draw Two', () => {
  it('makes the next player draw 2 and skip (2 players)', () => {
    const drawTwo = act('draw_two', 'red');
    const state = makeState({
      players: [player('human', [drawTwo, num('red', 1)]), player('bot1', [], true)],
      drawPile: [num('green', 1), num('green', 2), num('green', 3)],
    });
    const { state: next, events } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: drawTwo.id,
    });
    expect(next.players[1]!.hand).toHaveLength(2);
    expect(next.currentPlayerIndex).toBe(0);
    const penalty = events.find((event) => event.type === 'DRAW_PENALTY');
    expect(penalty && penalty.type === 'DRAW_PENALTY' ? penalty.targetId : null).toBe('bot1');
  });

  it('skips the victim and passes to the following player (3 seats)', () => {
    const drawTwo = act('draw_two', 'red');
    const state = makeThreePlayerState({
      players: [
        player('human', [drawTwo, num('red', 1)]),
        player('bot1', [], true),
        player('bot2', [], true),
      ],
      drawPile: [num('green', 1), num('green', 2), num('green', 3)],
    });
    const { state: next } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: drawTwo.id,
    });
    expect(next.players[1]!.hand).toHaveLength(2);
    expect(next.currentPlayerIndex).toBe(2);
  });
});

describe('Wild', () => {
  it('sets the active colour to the chosen one', () => {
    const w = wild('wild');
    const state = makeState({
      players: [player('human', [w, num('red', 1)]), player('bot1', [], true)],
    });
    const { state: next, events } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: w.id,
      chosenColor: 'blue',
    });
    expect(next.activeColor).toBe('blue');
    expect(eventTypes(events)).toContain('WILD_COLOR_CHOSEN');
  });
});

describe('Wild Draw Four', () => {
  it('makes the next player draw 4 and skip', () => {
    const w4 = wild('wild_draw_four');
    const state = makeState({
      players: [player('human', [w4, num('red', 1)]), player('bot1', [], true)],
      drawPile: [num('green', 1), num('green', 2), num('green', 3), num('green', 4)],
    });
    const { state: next, events } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: w4.id,
      chosenColor: 'green',
    });
    expect(next.players[1]!.hand).toHaveLength(4);
    expect(next.currentPlayerIndex).toBe(0);
    const penalty = events.find((event) => event.type === 'DRAW_PENALTY');
    expect(penalty && penalty.type === 'DRAW_PENALTY' ? penalty.count : null).toBe(4);
  });
});

describe('stack Draw Two house rule', () => {
  it('lets the next player stack and passes the accumulated penalty on', () => {
    const first = act('draw_two', 'red');
    const stack = act('draw_two', 'blue');
    const state = makeState({
      config: { stackDrawTwo: true },
      players: [player('human', [first, num('red', 1)]), player('bot1', [stack, num('red', 2)], true)],
    });
    const afterFirst = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: first.id });
    expect(afterFirst.state.pendingDraw).toBe(2);
    expect(afterFirst.state.currentPlayerIndex).toBe(1);

    const afterStack = reduce(afterFirst.state, {
      type: 'PLAY_CARD',
      playerId: 'bot1',
      cardId: stack.id,
    });
    expect(afterStack.state.pendingDraw).toBe(4);
    expect(afterStack.state.currentPlayerIndex).toBe(0);
  });

  it('charges the full accumulated penalty when a player accepts', () => {
    const first = act('draw_two', 'red');
    const stack = act('draw_two', 'blue');
    let state = makeState({
      config: { stackDrawTwo: true },
      players: [player('human', [first, num('red', 1)]), player('bot1', [stack, num('red', 2)], true)],
      drawPile: [num('green', 1), num('green', 2), num('green', 3), num('green', 4)],
    });
    state = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: first.id }).state;
    state = reduce(state, { type: 'PLAY_CARD', playerId: 'bot1', cardId: stack.id }).state;
    const final = reduce(state, { type: 'DRAW_CARD', playerId: 'human' });
    expect(final.state.players[0]!.hand).toHaveLength(5);
    expect(final.state.pendingDraw).toBe(0);
  });
});

describe('drawing', () => {
  it('draws one card and keeps the turn until the player decides', () => {
    const drawn = num('red', 5);
    const state = makeState({
      players: [player('human', [num('blue', 1)]), player('bot1', [], true)],
      drawPile: [num('green', 2), drawn],
    });
    const { state: next, events } = reduce(state, { type: 'DRAW_CARD', playerId: 'human' });
    expect(next.players[0]!.hand).toHaveLength(2);
    expect(next.drawnCardId).toBe(drawn.id);
    expect(next.currentPlayerIndex).toBe(0);
    expect(eventTypes(events)).not.toContain('TURN_CHANGED');
  });

  it('allows playing the freshly drawn card, then advances', () => {
    const drawn = num('red', 5);
    const state = makeState({
      players: [player('human', [num('blue', 1)]), player('bot1', [], true)],
      drawPile: [num('green', 2), drawn],
    });
    const afterDraw = reduce(state, { type: 'DRAW_CARD', playerId: 'human' }).state;
    const { state: next, events } = reduce(afterDraw, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: drawn.id,
    });
    expect(top(next).id).toBe(drawn.id);
    expect(next.currentPlayerIndex).toBe(1);
    expect(eventTypes(events)).toContain('PLAY_CARD');
  });

  it('ends the turn when the drawn card cannot be played', () => {
    const drawn = num('blue', 7);
    const state = makeState({
      players: [player('human', [num('blue', 1)]), player('bot1', [], true)],
      drawPile: [drawn],
    });
    const afterDraw = reduce(state, { type: 'DRAW_CARD', playerId: 'human' }).state;
    const { state: next, events } = reduce(afterDraw, { type: 'END_TURN', playerId: 'human' });
    expect(next.currentPlayerIndex).toBe(1);
    expect(eventTypes(events)).toContain('TURN_CHANGED');
    expect(next.drawnCardId).toBeNull();
  });

  it('reshuffles the discard pile when the draw pile runs out', () => {
    const state = makeState({
      players: [player('human', [num('red', 1)]), player('bot1', [], true)],
      drawPile: [],
      discardPile: [num('blue', 1), num('blue', 2), num('blue', 3)],
      activeColor: 'blue',
    });
    const { state: next, events } = reduce(state, { type: 'DRAW_CARD', playerId: 'human' });
    expect(eventTypes(events)).toContain('SHUFFLE_DISCARD');
    expect(next.players[0]!.hand).toHaveLength(2);
    expect(next.discardPile).toHaveLength(1);
    expect(next.drawPile).toHaveLength(1);
  });
});

describe('UNO', () => {
  it('marks a player vulnerable when they reach one card', () => {
    const card = num('red', 5);
    const state = makeState({
      players: [player('human', [card, num('red', 6)]), player('bot1', [], true)],
    });
    const { state: next } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: card.id,
    });
    expect(next.unoPending?.playerId).toBe('human');
  });

  it('penalises a forgetful player when caught', () => {
    const card = num('red', 5);
    const state = makeState({
      players: [player('human', [card, num('red', 6)]), player('bot1', [], true)],
      drawPile: [num('green', 1), num('green', 2)],
    });
    const afterPlay = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: card.id }).state;
    const { state: next, events } = reduce(afterPlay, {
      type: 'CATCH_UNO',
      playerId: 'bot1',
      targetId: 'human',
    });
    expect(next.players[0]!.hand).toHaveLength(3);
    expect(eventTypes(events)).toContain('UNO_PENALTY');
    expect(next.unoPending).toBeNull();
  });

  it('does not penalise a player who is no longer at one card', () => {
    const state = makeState({
      players: [player('human', [num('red', 5), num('red', 6)]), player('bot1', [], true)],
      unoPending: { playerId: 'human' },
      drawPile: [num('green', 1), num('green', 2)],
    });
    const { events } = reduce(state, { type: 'CATCH_UNO', playerId: 'bot1', targetId: 'human' });
    expect(events).toHaveLength(0);
  });

  it('protects a player who calls UNO', () => {
    const card = num('red', 5);
    const state = makeState({
      players: [player('human', [card, num('red', 6)]), player('bot1', [], true)],
      drawPile: [num('green', 1), num('green', 2)],
    });
    const afterPlay = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: card.id }).state;
    const called = reduce(afterPlay, { type: 'CALL_UNO', playerId: 'human' });
    expect(called.state.unoPending).toBeNull();
    expect(eventTypes(called.events)).toContain('UNO_CALLED');

    const caught = reduce(called.state, {
      type: 'CATCH_UNO',
      playerId: 'bot1',
      targetId: 'human',
    });
    expect(caught.events).toHaveLength(0);
  });

  it('lets the window close once another player acts', () => {
    const card = num('red', 5);
    const state = makeState({
      players: [player('human', [card, num('red', 6)]), player('bot1', [num('green', 1)], true)],
      drawPile: [num('green', 1), num('green', 2)],
    });
    const afterPlay = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: card.id }).state;
    expect(afterPlay.unoPending?.playerId).toBe('human');
    const afterBotDraw = reduce(afterPlay, { type: 'DRAW_CARD', playerId: 'bot1' }).state;
    expect(afterBotDraw.unoPending).toBeNull();
  });
});

describe('winning', () => {
  it('ends the round when a player sheds their last card', () => {
    const card = num('red', 5);
    const state = makeState({
      players: [player('human', [card]), player('bot1', [], true)],
    });
    const { state: next, events } = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: card.id,
    });
    expect(next.phase).toBe('roundOver');
    expect(next.winnerId).toBe('human');
    expect(next.players[0]!.hand).toHaveLength(0);
    expect(eventTypes(events)).toContain('ROUND_WON');
  });

  it('ignores actions after the round is over', () => {
    const card = num('red', 5);
    const state = makeState({ players: [player('human', [card]), player('bot1', [], true)] });
    const won = reduce(state, { type: 'PLAY_CARD', playerId: 'human', cardId: card.id }).state;
    const after = reduce(won, { type: 'DRAW_CARD', playerId: 'bot1' });
    expect(after.state).toBe(won);
    expect(after.events).toHaveLength(0);
  });
});

describe('RESTART', () => {
  it('returns to the menu', () => {
    const { state } = createGame({ botCount: 1, stackDrawTwo: false, seed: 3 });
    const restarted = reduce(state, { type: 'RESTART' });
    expect(restarted.state.phase).toBe('menu');
  });
});
