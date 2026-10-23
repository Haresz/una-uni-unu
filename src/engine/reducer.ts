/**
 * The reducer: the single source of truth for game rules.
 *
 * `reduce(state, action)` returns a NEW state plus a list of `events`
 * describing what changed. It is pure and deterministic (all randomness comes
 * from `state.rng`), so a whole game can be replayed and tested outside the
 * browser. If you want to change a rule, this is almost always the file to open.
 */
import type {
  Card,
  Direction,
  GameAction,
  GameConfig,
  GameEvent,
  GameState,
  Player,
  ReduceResult,
} from './types';
import { createDeck, dealHands, shuffleDeck } from './deck';
import { seedFromNumber, shuffle } from './prng';
import { getPlayer, isPlayable, isWild, offsetIndex } from './rules';

export const HAND_SIZE = 7;
export const MIN_BOTS = 1;
export const MAX_BOTS = 3;

export const DEFAULT_CONFIG: GameConfig = {
  botCount: 2,
  stackDrawTwo: false,
  seed: 1,
};

export function createMenuState(): GameState {
  return {
    phase: 'menu',
    config: { ...DEFAULT_CONFIG },
    rng: seedFromNumber(DEFAULT_CONFIG.seed),
    players: [],
    drawPile: [],
    discardPile: [],
    currentPlayerIndex: 0,
    direction: 1,
    activeColor: 'red',
    pendingDraw: 0,
    drawnCardId: null,
    unoPending: null,
    winnerId: null,
    turnCount: 0,
  };
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    config: { ...state.config },
    players: state.players.map((player) => ({ ...player, hand: player.hand.slice() })),
    drawPile: state.drawPile.slice(),
    discardPile: state.discardPile.slice(),
    unoPending: state.unoPending ? { ...state.unoPending } : null,
  };
}

function clampBots(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CONFIG.botCount;
  return Math.min(MAX_BOTS, Math.max(MIN_BOTS, Math.floor(value)));
}

// ---------------------------------------------------------------------------
// Turn helpers
// ---------------------------------------------------------------------------

function advance(s: GameState, steps: number): void {
  s.currentPlayerIndex = offsetIndex(s, s.currentPlayerIndex, steps);
}

function emitTurnChanged(s: GameState, events: GameEvent[]): void {
  events.push({
    type: 'TURN_CHANGED',
    currentPlayerId: s.players[s.currentPlayerIndex]!.id,
    direction: s.direction,
  });
}

/** Finish the current player's turn and move `steps` seats forward. */
function endTurn(s: GameState, steps: number, events: GameEvent[]): void {
  s.turnCount += 1;
  s.drawnCardId = null;
  advance(s, steps);
  emitTurnChanged(s, events);
}

// ---------------------------------------------------------------------------
// Deck helpers
// ---------------------------------------------------------------------------

/**
 * Reshuffle the discard pile (keeping its top card in place) into a fresh draw
 * pile. Returns false when there is nothing to reshuffle.
 */
function reshuffleDiscard(s: GameState, events: GameEvent[]): boolean {
  if (s.discardPile.length <= 1 || s.drawPile.length > 0) return false;
  const top = s.discardPile[s.discardPile.length - 1]!;
  const rest = s.discardPile.slice(0, -1);
  const { result, state } = shuffle(rest, s.rng);
  s.rng = state;
  s.drawPile = result;
  s.discardPile = [top];
  events.push({ type: 'SHUFFLE_DISCARD', count: result.length });
  return result.length > 0;
}

/** Draw `count` cards for the player at `playerIndex`. Returns cards drawn. */
function drawCards(
  s: GameState,
  playerIndex: number,
  count: number,
  cause: 'voluntary' | 'penalty',
  events: GameEvent[],
): number {
  const player = s.players[playerIndex]!;
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (s.drawPile.length === 0) {
      const ok = reshuffleDiscard(s, events);
      if (!ok) break;
    }
    const card = s.drawPile.pop();
    if (!card) break;
    player.hand.push(card);
    events.push({ type: 'DRAW_CARD', playerId: player.id, cardId: card.id, card, cause });
    drawn += 1;
  }
  return drawn;
}

// ---------------------------------------------------------------------------
// UNO window helpers
// ---------------------------------------------------------------------------

function openUnoWindow(s: GameState, player: Player): void {
  if (player.hand.length === 1) {
    player.hasCalledUno = false;
    s.unoPending = { playerId: player.id };
  }
}

/**
 * Reconcile the UNO window when a player begins an action. The window is closed
 * when either (a) a *different* player acts (the vulnerable player has escaped,
 * as the window only lasts "until the next turn"), or (b) the vulnerable player
 * no longer holds exactly one card.
 */
function closeStaleUnoWindow(s: GameState, actorId: string): void {
  const pending = s.unoPending;
  if (!pending) return;
  const pendingPlayer = getPlayer(s, pending.playerId);
  if (!pendingPlayer || pendingPlayer.hand.length !== 1) {
    s.unoPending = null;
    return;
  }
  if (pending.playerId !== actorId) {
    s.unoPending = null;
  }
}

// ---------------------------------------------------------------------------
// Game setup
// ---------------------------------------------------------------------------

function startGame(config: GameConfig, events: GameEvent[]): GameState {
  const botCount = clampBots(config.botCount);
  const players: Player[] = [
    { id: 'human', name: 'You', isBot: false, hand: [], hasCalledUno: false },
  ];
  for (let i = 1; i <= botCount; i++) {
    players.push({
      id: `bot${i}`,
      name: `Bot ${i}`,
      isBot: true,
      hand: [],
      hasCalledUno: false,
    });
  }

  const rng = seedFromNumber(config.seed);
  const shuffled = shuffleDeck(createDeck(), rng);
  const dealt = dealHands(
    shuffled.deck,
    players.map((player) => player.id),
    HAND_SIZE,
    shuffled.rng,
  );
  dealt.hands.forEach((hand, index) => {
    players[index]!.hand = hand;
  });
  for (const event of dealt.events) {
    events.push({ type: 'DEAL', playerId: event.playerId, cardId: event.cardId });
  }

  let drawPile = dealt.deck;
  let rngState = dealt.rng;

  let initial = drawPile.pop();
  // Wilds open with no defined colour, so they go back and the deck reshuffles.
  while (initial && isWild(initial)) {
    drawPile.push(initial);
    const reshuffled = shuffleDeck(drawPile, rngState);
    drawPile = reshuffled.deck;
    rngState = reshuffled.rng;
    initial = drawPile.pop();
  }

  const state: GameState = {
    phase: 'playing',
    config: { ...config, botCount },
    rng: rngState,
    players,
    drawPile,
    discardPile: initial ? [initial] : [],
    currentPlayerIndex: 0,
    direction: 1,
    activeColor: initial?.color ?? 'red',
    pendingDraw: 0,
    drawnCardId: null,
    unoPending: null,
    winnerId: null,
    turnCount: 0,
  };

  if (initial) {
    events.push({ type: 'REVEAL_INITIAL', cardId: initial.id, card: initial });
    applyOpeningEffect(state, initial, events);
  }

  return state;
}

/**
 * Apply the effect of the opening card to the first player (index 0). Only
 * action cards have an effect here; wilds never appear as the opening card.
 */
function applyOpeningEffect(s: GameState, card: Card, events: GameEvent[]): void {
  const first = s.players[0]!;
  switch (card.kind) {
    case 'number':
      break;
    case 'skip': {
      events.push({ type: 'SKIP', playerId: first.id });
      advance(s, 1);
      emitTurnChanged(s, events);
      break;
    }
    case 'reverse': {
      if (s.players.length === 2) {
        events.push({ type: 'SKIP', playerId: first.id });
      } else {
        s.direction = (s.direction * -1) as Direction;
        events.push({ type: 'REVERSE', direction: s.direction });
      }
      advance(s, 1);
      emitTurnChanged(s, events);
      break;
    }
    case 'draw_two': {
      events.push({
        type: 'DRAW_PENALTY',
        sourceId: null,
        targetId: first.id,
        count: 2,
        kind: 'draw_two',
        pending: false,
      });
      drawCards(s, 0, 2, 'penalty', events);
      events.push({ type: 'SKIP', playerId: first.id });
      advance(s, 1);
      emitTurnChanged(s, events);
      break;
    }
    case 'wild':
    case 'wild_draw_four':
      // Never reached: wilds are reshuffled back before opening.
      break;
  }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function handlePlayCard(
  s: GameState,
  action: Extract<GameAction, { type: 'PLAY_CARD' }>,
  events: GameEvent[],
): void {
  console.log('handlePlayCard', action);
  const player = getPlayer(s, action.playerId);
  if (!player || s.players[s.currentPlayerIndex]!.id !== player.id) return;
  const cardIndex = player.hand.findIndex((card) => card.id === action.cardId);
  if (cardIndex < 0) return;
  const card = player.hand[cardIndex]!;
  console.log("Is playable:", isPlayable(s, card));
  if (!isPlayable(s, card)) return;
  if (isWild(card) && !action.chosenColor) return;

  closeStaleUnoWindow(s, player.id);

  player.hand.splice(cardIndex, 1);
  s.discardPile.push(card);
  s.drawnCardId = null;
  s.activeColor = isWild(card) ? action.chosenColor! : (card.color ?? s.activeColor);

  events.push({
    type: 'PLAY_CARD',
    playerId: player.id,
    cardId: card.id,
    card,
    chosenColor: isWild(card) ? action.chosenColor! : null,
  });
  if (isWild(card)) {
    events.push({ type: 'WILD_COLOR_CHOSEN', playerId: player.id, color: action.chosenColor! });
  }

  if (player.hand.length === 0) {
    s.phase = 'roundOver';
    s.winnerId = player.id;
    s.unoPending = null;
    events.push({ type: 'ROUND_WON', playerId: player.id });
    return;
  }

  openUnoWindow(s, player);

  switch (card.kind) {
    case 'number':
      endTurn(s, 1, events);
      break;
    case 'skip': {
      const skipped = s.players[offsetIndex(s, s.currentPlayerIndex, 1)]!.id;
      events.push({ type: 'SKIP', playerId: skipped });
      endTurn(s, 2, events);
      break;
    }
    case 'reverse': {
      if (s.players.length === 2) {
        // Acts like a skip: the opponent is skipped and you play again.
        const skipped = s.players[offsetIndex(s, s.currentPlayerIndex, 1)]!.id;
        events.push({ type: 'SKIP', playerId: skipped });
        endTurn(s, 2, events);
      } else {
        s.direction = (s.direction * -1) as Direction;
        events.push({ type: 'REVERSE', direction: s.direction });
        endTurn(s, 1, events);
      }
      break;
    }
    case 'draw_two': {
      if (s.config.stackDrawTwo) {
        s.pendingDraw += 2;
        advance(s, 1);
        events.push({
          type: 'DRAW_PENALTY',
          sourceId: player.id,
          targetId: s.players[s.currentPlayerIndex]!.id,
          count: s.pendingDraw,
          kind: 'draw_two',
          pending: true,
        });
        emitTurnChanged(s, events);
      } else {
        const victimIndex = offsetIndex(s, s.currentPlayerIndex, 1);
        const victim = s.players[victimIndex]!;
        events.push({
          type: 'DRAW_PENALTY',
          sourceId: player.id,
          targetId: victim.id,
          count: 2,
          kind: 'draw_two',
          pending: false,
        });
        drawCards(s, victimIndex, 2, 'penalty', events);
        endTurn(s, 2, events);
      }
      break;
    }
    case 'wild_draw_four': {
      const victimIndex = offsetIndex(s, s.currentPlayerIndex, 1);
      const victim = s.players[victimIndex]!;
      events.push({
        type: 'DRAW_PENALTY',
        sourceId: player.id,
        targetId: victim.id,
        count: 4,
        kind: 'wild_draw_four',
        pending: false,
      });
      drawCards(s, victimIndex, 4, 'penalty', events);
      endTurn(s, 2, events);
      break;
    }
    case 'wild':
      endTurn(s, 1, events);
      break;
  }
}

function handleDrawCard(
  s: GameState,
  action: Extract<GameAction, { type: 'DRAW_CARD' }>,
  events: GameEvent[],
): void {
  const player = getPlayer(s, action.playerId);
  if (!player || s.players[s.currentPlayerIndex]!.id !== player.id) return;
  // Already drew this turn: only play or end turn is allowed now.
  if (s.drawnCardId !== null && s.pendingDraw === 0) return;

  closeStaleUnoWindow(s, player.id);
  const playerIndex = s.currentPlayerIndex;

  if (s.pendingDraw > 0) {
    const amount = s.pendingDraw;
    drawCards(s, playerIndex, amount, 'penalty', events);
    s.pendingDraw = 0;
    endTurn(s, 1, events);
    return;
  }

  const drawn = drawCards(s, playerIndex, 1, 'voluntary', events);
  if (drawn === 0) {
    // Nothing to draw (deck exhausted and no discard to recycle).
    endTurn(s, 1, events);
    return;
  }
  const card = player.hand[player.hand.length - 1]!;
  s.drawnCardId = card.id;
}

function handleEndTurn(
  s: GameState,
  action: Extract<GameAction, { type: 'END_TURN' }>,
  events: GameEvent[],
): void {
  const player = getPlayer(s, action.playerId);
  if (!player || s.players[s.currentPlayerIndex]!.id !== player.id) return;
  if (s.drawnCardId === null) return;
  endTurn(s, 1, events);
}

function handleCallUno(
  s: GameState,
  action: Extract<GameAction, { type: 'CALL_UNO' }>,
  events: GameEvent[],
): void {
  const player = getPlayer(s, action.playerId);
  if (!player) return;
  if (!s.unoPending || s.unoPending.playerId !== player.id) return;
  if (player.hand.length !== 1) return;
  player.hasCalledUno = true;
  s.unoPending = null;
  events.push({ type: 'UNO_CALLED', playerId: player.id });
}

function handleCatchUno(
  s: GameState,
  action: Extract<GameAction, { type: 'CATCH_UNO' }>,
  events: GameEvent[],
): void {
  if (action.playerId === action.targetId) return;
  const target = getPlayer(s, action.targetId);
  if (!target) return;
  if (!s.unoPending || s.unoPending.playerId !== target.id) return;
  // A catch only lands while the target is genuinely down to one card.
  if (target.hand.length !== 1) return;
  s.unoPending = null;
  target.hasCalledUno = false;
  const targetIndex = s.players.indexOf(target);
  events.push({ type: 'UNO_PENALTY', playerId: target.id, count: 2 });
  drawCards(s, targetIndex, 2, 'penalty', events);
}

// ---------------------------------------------------------------------------
// Root reducer
// ---------------------------------------------------------------------------

export function reduce(state: GameState, action: GameAction): ReduceResult {
  if (action.type === 'START_GAME') {
    const events: GameEvent[] = [];
    return { state: startGame(action.config, events), events };
  }
  if (action.type === 'RESTART') {
    return { state: createMenuState(), events: [] };
  }
  if (state.phase !== 'playing') {
    return { state, events: [] };
  }

  const s = cloneState(state);
  const events: GameEvent[] = [];

  switch (action.type) {
    case 'PLAY_CARD':
      handlePlayCard(s, action, events);
      break;
    case 'DRAW_CARD':
      handleDrawCard(s, action, events);
      break;
    case 'END_TURN':
      handleEndTurn(s, action, events);
      break;
    case 'CALL_UNO':
      handleCallUno(s, action, events);
      break;
    case 'CATCH_UNO':
      handleCatchUno(s, action, events);
      break;
    default:
      break;
  }

  // No effect (invalid action): keep the original state reference.
  if (events.length === 0) {
    return { state, events };
  }
  return { state: s, events };
}

export { offsetIndex };

export function createGame(config: GameConfig): ReduceResult {
  return reduce(createMenuState(), { type: 'START_GAME', config });
}
