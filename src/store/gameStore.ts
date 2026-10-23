/**
 * The game store (Zustand): the bridge between the pure engine and React.
 *
 * Components never call `reduce` directly. They call store actions, which
 * dispatch to the engine, save the new state, and publish the resulting events
 * (with a bumped `eventBatchId`) for the animation and sound hooks to consume.
 */
import { create } from 'zustand';
import {
  createMenuState,
  currentPlayer,
  getPlayableCards,
  isPlayable,
  reduce,
} from '../engine';
import type {
  CardColor,
  GameAction,
  GameConfig,
  GameEvent,
  GameState,
} from '../engine/types';

export interface StartOptions {
  botCount: number;
  stackDrawTwo: boolean;
}

interface GameStore {
  state: GameState;
  /** Card the human has raised out of their hand. */
  selectedId: string | null;
  /** Wild card awaiting a colour choice. */
  pendingWildId: string | null;
  /** Events from the most recent reduce, consumed by the animation queue. */
  lastEvents: GameEvent[];
  /** Increments on every state change so the queue can ingest each batch once. */
  eventBatchId: number;

  startGame: (options: StartOptions) => void;
  goToMenu: () => void;
  selectCard: (cardId: string) => void;
  clearSelection: () => void;
  confirmWild: (color: CardColor) => void;
  cancelWild: () => void;
  drawCard: () => void;
  pass: () => void;
  callUno: (playerId: string) => void;
  catchUno: (targetId: string) => void;
  dispatch: (action: GameAction) => { state: GameState; events: GameEvent[] };
}

function makeSeed(): number {
  const random = Math.floor(Math.random() * 0xffffffff);
  return ((Date.now() ^ random) >>> 0) || 1;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createMenuState(),
  selectedId: null,
  pendingWildId: null,
  lastEvents: [],
  eventBatchId: 0,

  dispatch: (action) => {
    const current = get().state;
    const result = reduce(current, action);
    if (result.state !== current) {
      set({
        state: result.state,
        lastEvents: result.events,
        eventBatchId: get().eventBatchId + 1,
      });
    }
    return result;
  },

  startGame: ({ botCount, stackDrawTwo }) => {
    const config: GameConfig = { botCount, stackDrawTwo, seed: makeSeed() };
    set({ selectedId: null, pendingWildId: null, lastEvents: [] });
    get().dispatch({ type: 'START_GAME', config });
  },

  goToMenu: () => {
    set({ state: createMenuState(), selectedId: null, pendingWildId: null, lastEvents: [] });
  },

  selectCard: (cardId) => {
    const { state } = get();
    if (state.phase !== 'playing') return;
    const current = currentPlayer(state);
    if (current.id !== 'human') return;
    const card = current.hand.find((candidate) => candidate.id === cardId);
    if (!card || !isPlayable(state, card)) return;

    if (card.kind === 'wild' || card.kind === 'wild_draw_four') {
      set({ pendingWildId: cardId });
      return;
    }
    const { state: next } = get().dispatch({
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId,
    });
    if (next !== state) set({ selectedId: null });
  },

  clearSelection: () => set({ selectedId: null }),

  confirmWild: (color) => {
    const { pendingWildId } = get();
    if (!pendingWildId) return;
    get().dispatch({
      type: 'PLAY_CARD',
      playerId: 'human',
      cardId: pendingWildId,
      chosenColor: color,
    });
    set({ pendingWildId: null, selectedId: null });
  },

  cancelWild: () => set({ pendingWildId: null }),

  drawCard: () => {
    const { state } = get();
    if (state.phase !== 'playing') return;
    if (currentPlayer(state).id !== 'human') return;
    if (state.drawnCardId !== null && state.pendingDraw === 0) return;
    const { state: next } = get().dispatch({ type: 'DRAW_CARD', playerId: 'human' });
    const human = next.players[0]!;
    const drawn = human.hand.find((card) => card.id === next.drawnCardId);
    if (drawn && isPlayable(next, drawn)) {
      set({ selectedId: drawn.id });
    }
  },

  pass: () => {
    const { state } = get();
    if (state.drawnCardId === null) return;
    get().dispatch({ type: 'END_TURN', playerId: 'human' });
    set({ selectedId: null });
  },

  callUno: (playerId) => {
    get().dispatch({ type: 'CALL_UNO', playerId });
  },

  catchUno: (targetId) => {
    get().dispatch({ type: 'CATCH_UNO', playerId: 'human', targetId });
  },
}));

export function selectPlayableIds(state: GameState): Set<string> {
  const human = state.players[0];
  if (!human) return new Set();
  return new Set(getPlayableCards(state, human).map((card) => card.id));
}
