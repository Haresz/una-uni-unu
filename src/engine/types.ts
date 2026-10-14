/**
 * Core domain types for the UNA-UNI-UNU game engine.
 *
 * IMPORTANT: this module is pure TypeScript and must never import React or
 * anything UI related. The engine only knows about rules, state and events.
 */

export type CardColor = 'red' | 'yellow' | 'green' | 'blue';

export type CardKind =
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw_two'
  | 'wild'
  | 'wild_draw_four';

/**
 * A single physical card. `color` is null for wild cards. `value` is only set
 * for number cards. The `id` is unique across the whole deck so the UI can use
 * shared layout animations between zones.
 */
export interface Card {
  id: string;
  kind: CardKind;
  color: CardColor | null;
  value: number | null;
}

export type Direction = 1 | -1;

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  hand: Card[];
  /** True once the player has acknowledged their last card with UNO. */
  hasCalledUno: boolean;
}

export type GamePhase = 'menu' | 'playing' | 'roundOver';

export interface GameConfig {
  /** Number of bots (1..3). Total players = botCount + 1 (human is index 0). */
  botCount: number;
  /** House rule: Draw Two may be stacked on Draw Two. */
  stackDrawTwo: boolean;
  /** Deterministic seed for the engine PRNG. */
  seed: number;
}

/**
 * Tracks a player who is down to their last card. While this is set the player
 * is *vulnerable* to being caught: any other player may issue CATCH_UNO, and
 * the window closes (player escapes) as soon as a different player begins an
 * action.
 */
export interface UnoPending {
  playerId: string;
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  /** Internal PRNG state so `reduce` stays pure and deterministic. */
  rng: number;
  players: Player[];
  drawPile: Card[];
  /** Last element is the top of the discard pile. */
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: Direction;
  /** The colour that must currently be matched (chosen colour for wilds). */
  activeColor: CardColor;
  /**
   * Accumulated penalty the current player owes when the stack-Draw-Two house
   * rule is active and a chain is in progress. 0 when there is no chain.
   */
  pendingDraw: number;
  /**
   * Set after the current player has drawn a card this turn. It holds the id of
   * the drawn card. While set the player may only play that card or end turn.
   */
  drawnCardId: string | null;
  unoPending: UnoPending | null;
  winnerId: string | null;
  /** Monotonic counter of completed player turns, handy for debugging. */
  turnCount: number;
}

export type GameAction =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; chosenColor?: CardColor }
  | { type: 'DRAW_CARD'; playerId: string }
  | { type: 'END_TURN'; playerId: string }
  | { type: 'CALL_UNO'; playerId: string }
  | { type: 'CATCH_UNO'; playerId: string; targetId: string }
  | { type: 'RESTART' };

export type DrawCause = 'voluntary' | 'penalty';

export type GameEvent =
  /** One card dealt to a player, emitted in deal order for staggered animation. */
  | { type: 'DEAL'; playerId: string; cardId: string }
  /** The first card flipped onto the discard pile to open the round. */
  | { type: 'REVEAL_INITIAL'; cardId: string; card: Card }
  | {
      type: 'PLAY_CARD';
      playerId: string;
      cardId: string;
      card: Card;
      chosenColor: CardColor | null;
    }
  | { type: 'DRAW_CARD'; playerId: string; cardId: string; card: Card; cause: DrawCause }
  | { type: 'SKIP'; playerId: string }
  | { type: 'REVERSE'; direction: Direction }
  | {
      type: 'DRAW_PENALTY';
      /** Player who caused the penalty, or null when it is the opening card. */
      sourceId: string | null;
      targetId: string;
      count: number;
      kind: 'draw_two' | 'wild_draw_four';
      /** True while a stack-Draw-Two chain is open (cards not drawn yet). */
      pending: boolean;
    }
  | { type: 'WILD_COLOR_CHOSEN'; playerId: string; color: CardColor }
  | { type: 'SHUFFLE_DISCARD'; count: number }
  | { type: 'UNO_CALLED'; playerId: string }
  | { type: 'UNO_PENALTY'; playerId: string; count: number }
  | { type: 'TURN_CHANGED'; currentPlayerId: string; direction: Direction }
  | { type: 'ROUND_WON'; playerId: string };

export interface ReduceResult {
  state: GameState;
  events: GameEvent[];
}
