import type {
  Card,
  CardColor,
  CardKind,
  GameConfig,
  GameState,
  Player,
} from '../types';

let idCounter = 0;

export function makeCard(
  kind: CardKind,
  color: CardColor | null,
  value: number | null = null,
): Card {
  return { id: `t${idCounter++}`, kind, color, value };
}

export const num = (color: CardColor, value: number): Card =>
  makeCard('number', color, value);
export const act = (kind: 'skip' | 'reverse' | 'draw_two', color: CardColor): Card =>
  makeCard(kind, color);
export const wild = (kind: 'wild' | 'wild_draw_four' = 'wild'): Card => makeCard(kind, null);

export function player(id: string, hand: Card[], isBot = false): Player {
  return { id, name: id, isBot, hand, hasCalledUno: false };
}

export type StateOverrides = Partial<Omit<GameState, 'config'>> & {
  config?: Partial<GameConfig>;
};

export function makeState(overrides: StateOverrides = {}): GameState {
  const base: GameState = {
    phase: 'playing',
    config: { botCount: 1, stackDrawTwo: false, seed: 1 } satisfies GameConfig,
    rng: 1,
    players: [
      player('human', []),
      player('bot1', [], true),
    ],
    drawPile: [],
    discardPile: [num('red', 9)],
    currentPlayerIndex: 0,
    direction: 1,
    activeColor: 'red',
    pendingDraw: 0,
    drawnCardId: null,
    unoPending: null,
    winnerId: null,
    turnCount: 0,
  };

  return {
    ...base,
    ...overrides,
    config: { ...base.config, ...(overrides.config ?? {}) },
    players: overrides.players ?? base.players,
    discardPile: overrides.discardPile ?? base.discardPile,
  };
}

/** Build a 3-seat state to exercise direction/skip logic more richly. */
export function makeThreePlayerState(overrides: StateOverrides = {}): GameState {
  return makeState({
    players: [
      player('human', []),
      player('bot1', [], true),
      player('bot2', [], true),
    ],
    ...overrides,
  });
}

export function eventTypes(events: { type: string }[]): string[] {
  return events.map((event) => event.type);
}
