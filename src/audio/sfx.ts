import type { GameEvent } from '../engine/types';

export type SoundName =
  | 'click'
  | 'play'
  | 'draw'
  | 'deal'
  | 'shuffle'
  | 'skip'
  | 'reverse'
  | 'wild'
  | 'uno'
  | 'penalty'
  | 'turn'
  | 'win'
  | 'lose';

/** File extension for the audio assets. Change once to switch format. */
export const AUDIO_EXT = 'wav';

export const SOUND_FILES: Record<SoundName, string> = {
  click: `sounds/click.${AUDIO_EXT}`,
  play: `sounds/play.${AUDIO_EXT}`,
  draw: `sounds/draw.${AUDIO_EXT}`,
  deal: `sounds/deal.${AUDIO_EXT}`,
  shuffle: `sounds/shuffle.${AUDIO_EXT}`,
  skip: `sounds/skip.${AUDIO_EXT}`,
  reverse: `sounds/reverse.${AUDIO_EXT}`,
  wild: `sounds/wild.${AUDIO_EXT}`,
  uno: `sounds/uno.${AUDIO_EXT}`,
  penalty: `sounds/penalty.${AUDIO_EXT}`,
  turn: `sounds/turn.${AUDIO_EXT}`,
  win: `sounds/win.${AUDIO_EXT}`,
  lose: `sounds/lose.${AUDIO_EXT}`,
};

export const ALL_SOUND_NAMES = Object.keys(SOUND_FILES) as SoundName[];

/**
 * Map a single engine event to the sound it should play, or `null` for events
 * that stay silent. `humanId` lets us pick win/lose and only chime on the
 * human's turn. Callers throttle high-frequency batches (the opening deal).
 */
export function soundForEvent(event: GameEvent, humanId = 'human'): SoundName | null {
  switch (event.type) {
    case 'REVEAL_INITIAL':
    case 'PLAY_CARD':
      return 'play';
    case 'DRAW_CARD':
      return 'draw';
    case 'DEAL':
      return 'deal';
    case 'SHUFFLE_DISCARD':
      return 'shuffle';
    case 'SKIP':
      return 'skip';
    case 'REVERSE':
      return 'reverse';
    case 'WILD_COLOR_CHOSEN':
      return 'wild';
    case 'UNO_CALLED':
      return 'uno';
    case 'UNO_PENALTY':
    case 'DRAW_PENALTY':
      return 'penalty';
    case 'TURN_CHANGED':
      return event.currentPlayerId === humanId ? 'turn' : null;
    case 'ROUND_WON':
      return event.playerId === humanId ? 'win' : 'lose';
    default:
      return null;
  }
}
