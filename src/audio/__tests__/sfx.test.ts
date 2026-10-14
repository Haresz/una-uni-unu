import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../engine/types';
import { ALL_SOUND_NAMES, AUDIO_EXT, SOUND_FILES, soundForEvent } from '../sfx';

describe('SOUND_FILES', () => {
  it('has an entry for every sound name', () => {
    expect(ALL_SOUND_NAMES).toHaveLength(13);
    for (const name of ALL_SOUND_NAMES) {
      expect(SOUND_FILES[name]).toBe(`sounds/${name}.${AUDIO_EXT}`);
    }
  });
});

describe('soundForEvent', () => {
  it('maps play-related events', () => {
    const play: GameEvent[] = [
      { type: 'REVEAL_INITIAL', cardId: 'c', card: { id: 'c', kind: 'number', color: 'red', value: 1 } },
      { type: 'PLAY_CARD', playerId: 'human', cardId: 'c', card: { id: 'c', kind: 'number', color: 'red', value: 1 }, chosenColor: null },
    ];
    expect(play.map((e) => soundForEvent(e))).toEqual(['play', 'play']);
  });

  it('maps the distinct action events', () => {
    expect(soundForEvent({ type: 'DRAW_CARD', playerId: 'human', cardId: 'c', card: { id: 'c', kind: 'number', color: 'red', value: 1 }, cause: 'voluntary' })).toBe('draw');
    expect(soundForEvent({ type: 'DEAL', playerId: 'human', cardId: 'c' })).toBe('deal');
    expect(soundForEvent({ type: 'SHUFFLE_DISCARD', count: 3 })).toBe('shuffle');
    expect(soundForEvent({ type: 'SKIP', playerId: 'bot1' })).toBe('skip');
    expect(soundForEvent({ type: 'REVERSE', direction: -1 })).toBe('reverse');
    expect(soundForEvent({ type: 'WILD_COLOR_CHOSEN', playerId: 'human', color: 'blue' })).toBe('wild');
    expect(soundForEvent({ type: 'UNO_CALLED', playerId: 'bot1' })).toBe('uno');
    expect(soundForEvent({ type: 'UNO_PENALTY', playerId: 'human', count: 2 })).toBe('penalty');
    expect(soundForEvent({ type: 'DRAW_PENALTY', sourceId: 'bot1', targetId: 'human', count: 2, kind: 'draw_two', pending: false })).toBe('penalty');
  });

  it('only chimes on the human turn', () => {
    expect(soundForEvent({ type: 'TURN_CHANGED', currentPlayerId: 'human', direction: 1 })).toBe('turn');
    expect(soundForEvent({ type: 'TURN_CHANGED', currentPlayerId: 'bot1', direction: 1 })).toBeNull();
  });

  it('picks win or lose from the winner', () => {
    expect(soundForEvent({ type: 'ROUND_WON', playerId: 'human' })).toBe('win');
    expect(soundForEvent({ type: 'ROUND_WON', playerId: 'bot1' })).toBe('lose');
  });
});
