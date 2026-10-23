/**
 * Pure rule helpers: "is this card playable?", turn maths, colour counting.
 *
 * Nothing here mutates state, and both the reducer and the bot call these
 * functions, so the human and the AI obey exactly the same rules.
 */
import type { Card, CardColor, GameState, Player } from './types';

export function isWild(card: Card): boolean {
  return card.kind === 'wild' || card.kind === 'wild_draw_four';
}

export function topCard(state: GameState): Card | undefined {
  return state.discardPile[state.discardPile.length - 1];
}

/** Human readable label, useful for toasts and debugging. */
export function cardLabel(card: Card): string {
  const color = card.color ? `${card.color} ` : '';
  switch (card.kind) {
    case 'number':
      return `${color}${card.value}`;
    case 'skip':
      return `${color}Skip`;
    case 'reverse':
      return `${color}Reverse`;
    case 'draw_two':
      return `${color}Draw Two`;
    case 'wild':
      return 'Wild';
    case 'wild_draw_four':
      return 'Wild Draw Four';
  }
}

/**
 * Does a card match the current top of the discard pile / active colour?
 * Wilds always match. Otherwise colour, number or symbol match.
 */
export function cardMatchesTop(state: GameState, card: Card): boolean {
  if (isWild(card)) return true;
  const top = topCard(state);
  if (!top) return true;
  if (card.color !== null && card.color === state.activeColor) return true;
  if (card.kind === 'number' && top.kind === 'number' && card.value === top.value) {
    return true;
  }
  if (card.kind !== 'number' && card.kind === top.kind) return true;
  return false;
}

/**
 * Whether `card` can legally be played by the current player right now.
 * When a stack-Draw-Two chain is active the only legal card is a Draw Two.
 */
export function isPlayable(state: GameState, card: Card): boolean {
  if (state.pendingDraw > 0) {
    return state.config.stackDrawTwo && card.kind === 'draw_two';
  }
  if (state.drawnCardId !== null) {
    return card.id === state.drawnCardId && cardMatchesTop(state, card);
  }
  return cardMatchesTop(state, card);
}

export function getPlayableCards(state: GameState, player: Player): Card[] {
  return player.hand.filter((card) => isPlayable(state, card));
}

export function hasPlayableCard(state: GameState, player: Player): boolean {
  return getPlayableCards(state, player).length > 0;
}

/** Colour most represented in a hand (used when a bot picks a wild colour). */
export function mostCommonColor(hand: readonly Card[]): CardColor {
  const counts: Record<CardColor, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  for (const card of hand) {
    if (card.color) counts[card.color] += 1;
  }
  let best: CardColor = 'red';
  let bestCount = -1;
  for (const color of ['red', 'yellow', 'green', 'blue'] as const) {
    if (counts[color] > bestCount) {
      best = color;
      bestCount = counts[color];
    }
  }
  return best;
}

/** Seat offset from `index` in the given direction, wrapped to player count. */
export function offsetIndex(state: GameState, index: number, steps: number): number {
  const count = state.players.length;
  return (((index + state.direction * steps) % count) + count) % count;
}

export function getPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find((player) => player.id === playerId);
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]!;
}
