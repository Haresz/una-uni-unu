import { useEffect } from 'react';
import {
  chooseBotAction,
  currentPlayer,
  isPlayable,
} from '../engine';
import { botRemembersUno, botWantsToCatch } from '../engine/bot';
import { selectAnimationsBusy, useAnimationStore } from '../store/animationStore';
import { useGameStore } from '../store/gameStore';

/** Bot "thinking" pause before it plays. */
const BOT_MIN_MS = 800;
const BOT_MAX_MS = 1500;
/** Pause before a bot remembers to call UNO after reaching one card. */
const UNO_CALL_MIN_MS = 220;
const UNO_CALL_MAX_MS = 560;
/** Pause before a bot challenges a forgetful human. */
const CATCH_MIN_MS = 450;
const CATCH_MAX_MS = 950;
/** Pause before an unplayable drawn card is auto-passed. */
const AUTO_PASS_MS = 700;

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * After a bot acts, if it dropped to one card, give it a beat to remember UNO.
 * On a rare lapse the window stays open and the human may catch it.
 */
function scheduleUnoCall(botId: string): void {
  window.setTimeout(() => {
    const state = useGameStore.getState().state;
    if (state.unoPending?.playerId !== botId) return;
    if (botRemembersUno(Math.random())) {
      useGameStore.getState().callUno(botId);
    }
  }, between(UNO_CALL_MIN_MS, UNO_CALL_MAX_MS));
}

/** Play the current bot's move on the freshest state. */
function actBot(): void {
  const action = chooseBotAction(useGameStore.getState().state);
  if (!action) return;
  const actedId = action.playerId;
  const { state: next } = useGameStore.getState().dispatch(action);
  if (next.unoPending?.playerId === actedId) {
    scheduleUnoCall(actedId);
  }
}

/**
 * Drives everything that is not a human click: bot turns with a random thinking
 * delay, bots remembering to call UNO, bots catching a forgetful human, and
 * auto-passing after an unplayable draw.
 */
export function useGameDriver() {
  const state = useGameStore((s) => s.state);
  const animationsBusy = useAnimationStore(selectAnimationsBusy);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    // Let in-flight animations resolve before the next move is scheduled, so
    // plays are never hidden behind a fast bot action.
    if (animationsBusy) return;
    const current = currentPlayer(state);

    // 1. The human just drew a card.
    if (current.id === 'human' && state.drawnCardId !== null) {
      const human = state.players[0]!;
      const drawn = human.hand.find((card) => card.id === state.drawnCardId);
      if (drawn && isPlayable(state, drawn)) return; // wait for the player
      const timer = window.setTimeout(
        () => useGameStore.getState().pass(),
        AUTO_PASS_MS,
      );
      return () => window.clearTimeout(timer);
    }

    // 2. A bot's turn.
    if (current.isBot) {
      const humanIsVulnerable = state.unoPending?.playerId === 'human';
      if (humanIsVulnerable && botWantsToCatch(Math.random())) {
        const timer = window.setTimeout(() => {
          const fresh = useGameStore.getState().state;
          if (fresh.unoPending?.playerId === 'human') {
            // Catch only; the state change re-runs this effect, which will
            // then schedule the bot's actual move.
            useGameStore.getState().dispatch({
              type: 'CATCH_UNO',
              playerId: currentPlayer(fresh).id,
              targetId: 'human',
            });
            return;
          }
          actBot();
        }, between(CATCH_MIN_MS, CATCH_MAX_MS));
        return () => window.clearTimeout(timer);
      }

      const timer = window.setTimeout(actBot, between(BOT_MIN_MS, BOT_MAX_MS));
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [state, animationsBusy]);
}
