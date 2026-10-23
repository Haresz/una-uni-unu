/**
 * Bot strategy. Pure decision-making only: `chooseBotAction` returns the next
 * action, while pacing (thinking delays) lives in the UI driver hook.
 *
 * Randomness is passed in as plain numbers so the bot stays deterministic and
 * easy to test.
 */
import type { Card, CardColor, GameAction, GameState } from './types';
import { currentPlayer, getPlayableCards, isPlayable, isWild, mostCommonColor } from './rules';

/** Chance a bot forgets to call UNO when it reaches one card. */
export const BOT_UNO_FORGET_CHANCE = 0.15;
/** Chance a bot bothers to catch a forgetful human. */
export const BOT_CATCH_CHANCE = 0.5;

/** Pick the colour a bot should declare for a wild: the one it holds most of. */
export function chooseColor(hand: readonly Card[]): CardColor {
  return mostCommonColor(hand);
}

function fewestOpponentCards(state: GameState, botId: string): number {
  const counts = state.players
    .filter((player) => player.id !== botId)
    .map((player) => player.hand.length);
  return counts.length ? Math.min(...counts) : Number.POSITIVE_INFINITY;
}

const AGGRESSIVE_ORDER: readonly Card['kind'][] = [
  'wild_draw_four',
  'draw_two',
  'skip',
  'reverse',
];

function pickCard(playable: readonly Card[], aggressive: boolean): Card {
  if (aggressive) {
    for (const kind of AGGRESSIVE_ORDER) {
      const card = playable.find((candidate) => candidate.kind === kind);
      if (card) return card;
    }
  }

  const nonWild = playable.filter((card) => !isWild(card));
  const numbers = nonWild.filter((card) => card.kind === 'number');
  if (numbers.length > 0) {
    // Dump the highest number first; keep low cards as a buffer.
    return numbers.reduce((a, b) => ((b.value ?? 0) > (a.value ?? 0) ? b : a));
  }

  const action = nonWild.find(
    (card) => card.kind === 'skip' || card.kind === 'reverse' || card.kind === 'draw_two',
  );
  if (action) return action;

  const wild = playable.find(isWild);
  if (wild) return wild;

  return playable[0]!;
}

/** The subset of actions a bot issues for its own turn. */
export type BotAction = Extract<GameAction, { playerId: string }>;

/**
 * Choose the single next action for the current bot. Returns null when it is
 * not a bot's turn. The caller (UI + animation queue) is responsible for
 * pacing and for issuing follow-up actions such as CALL_UNO.
 */
export function chooseBotAction(state: GameState): BotAction | null {
  const bot = currentPlayer(state);
  if (!bot || !bot.isBot) return null;

  const playable = getPlayableCards(state, bot);

  // Responding to an open stack-Draw-Two chain: stack, or accept the penalty.
  if (state.pendingDraw > 0) {
    const stack = playable.find((card) => card.kind === 'draw_two');
    if (stack) {
      return { type: 'PLAY_CARD', playerId: bot.id, cardId: stack.id };
    }
    return { type: 'DRAW_CARD', playerId: bot.id };
  }

  // Already drew this turn: keep the drawn card if it is actually playable and
  // not a Wild (which we prefer to save for later).
  if (state.drawnCardId !== null) {
    const drawn = bot.hand.find((card) => card.id === state.drawnCardId);
    if (drawn && isPlayable(state, drawn) && !isWild(drawn)) {
      return { type: 'PLAY_CARD', playerId: bot.id, cardId: drawn.id };
    }
    return { type: 'END_TURN', playerId: bot.id };
  }

  if (playable.length === 0) {
    return { type: 'DRAW_CARD', playerId: bot.id };
  }

  const aggressive = fewestOpponentCards(state, bot.id) <= 2;
  const chosen = pickCard(playable, aggressive);
  if (isWild(chosen)) {
    const remaining = bot.hand.filter((card) => card.id !== chosen.id);
    return {
      type: 'PLAY_CARD',
      playerId: bot.id,
      cardId: chosen.id,
      chosenColor: chooseColor(remaining),
    };
  }
  return { type: 'PLAY_CARD', playerId: bot.id, cardId: chosen.id };
}

/** Should a bot remember to call UNO? `rngValue` is a float in [0, 1). */
export function botRemembersUno(
  rngValue: number,
  forgetChance: number = BOT_UNO_FORGET_CHANCE,
): boolean {
  return rngValue >= forgetChance;
}

/** Should a bot try to catch a forgetful opponent? `rngValue` in [0, 1). */
export function botWantsToCatch(
  rngValue: number,
  catchChance: number = BOT_CATCH_CHANCE,
): boolean {
  return rngValue < catchChance;
}
