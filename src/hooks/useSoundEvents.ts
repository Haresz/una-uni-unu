import { useEffect } from 'react';
import { playSound } from '../audio/soundManager';
import { unlockAudio } from '../audio/soundManager';
import { soundForEvent } from '../audio/sfx';
import { useGameStore } from '../store/gameStore';

/** The opening deal fires many DEAL events; play a tick for every Nth card. */
const DEAL_SOUND_EVERY = 3;

/**
 * Plays a sound for each significant engine event. Consumes the same event
 * batches as the animation queue. Mounted once, near the root.
 */
export function useSoundEvents(): void {
  const events = useGameStore((store) => store.lastEvents);
  const batchId = useGameStore((store) => store.eventBatchId);

  // Browsers only allow audio after a user gesture; unlock on the first one.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    let dealSeen = 0;
    for (const event of events) {
      if (event.type === 'DEAL') {
        dealSeen += 1;
        if (dealSeen % DEAL_SOUND_EVERY === 1) playSound('deal');
        continue;
      }
      const sound = soundForEvent(event);
      if (sound) playSound(sound);
    }
  }, [batchId, events]);
}
