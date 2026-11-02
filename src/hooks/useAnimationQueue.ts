import { useEffect } from 'react';
import { seatAnchor } from '../animation/anchors';
import type { AnimationDescriptor } from '../animation/types';
import { buildDealTimeline } from '../animation/dealTimeline';
import {
  BURST,
  CARD_FLY,
  DEAL_STAGGER,
  OPENING_EFFECT_GAP,
} from '../animation/timing';
import type { GameEvent } from '../engine/types';
import { useAnimationStore } from '../store/animationStore';
import { useGameStore } from '../store/gameStore';

/** Turn one batch of engine events into a list of timed animations. */
export function buildAnimations(events: readonly GameEvent[]): AnimationDescriptor[] {
  const out: AnimationDescriptor[] = [];
  const timeline = buildDealTimeline(events);
  const isInitialDeal = timeline !== null;
  const revealDelay = timeline?.revealDelay ?? 0;
  const openingEffectDelay = isInitialDeal ? revealDelay + CARD_FLY + OPENING_EFFECT_GAP : 0;
  let dealIndex = 0;
  let postDealDelay = 0;

  for (const event of events) {
    switch (event.type) {
      case 'DEAL': {
        out.push({
          kind: 'deal',
          from: 'draw',
          to: seatAnchor(event.playerId),
          faceDown: true,
          delay: timeline?.landings[dealIndex]?.delay ?? dealIndex * DEAL_STAGGER,
          duration: CARD_FLY,
        });
        dealIndex += 1;
        break;
      }
      case 'REVEAL_INITIAL': {
        out.push({
          kind: 'play',
          from: 'draw',
          to: 'discard',
          card: event.card,
          delay: revealDelay,
          duration: CARD_FLY,
        });
        postDealDelay = openingEffectDelay;
        break;
      }
      case 'PLAY_CARD': {
        out.push({
          kind: 'play',
          from: seatAnchor(event.playerId),
          to: 'discard',
          card: event.card,
          delay: postDealDelay,
          duration: CARD_FLY,
        });
        break;
      }
      case 'DRAW_CARD': {
        out.push({
          kind: 'draw',
          from: 'draw',
          to: seatAnchor(event.playerId),
          card: event.playerId === 'human' ? event.card : null,
          faceDown: event.playerId !== 'human',
          delay: postDealDelay,
          duration: CARD_FLY,
        });
        break;
      }
      case 'DRAW_PENALTY': {
        for (let i = 0; i < event.count; i += 1) {
          out.push({
            kind: 'draw',
            from: 'draw',
            to: seatAnchor(event.targetId),
            faceDown: true,
            delay: postDealDelay + i * 130,
            duration: CARD_FLY,
          });
        }
        break;
      }
      case 'SKIP': {
        out.push({
          kind: 'burst',
          from: seatAnchor(event.playerId),
          label: 'Skipped!',
          tone: 'info',
          delay: postDealDelay,
          duration: BURST,
        });
        break;
      }
      case 'REVERSE': {
        out.push({
          kind: 'burst',
          from: 'discard',
          label: 'Reverse!',
          tone: 'info',
          delay: postDealDelay,
          duration: BURST,
        });
        break;
      }
      case 'WILD_COLOR_CHOSEN': {
        out.push({
          kind: 'wild',
          from: 'discard',
          color: event.color,
          delay: postDealDelay,
          duration: 640,
        });
        break;
      }
      case 'UNO_CALLED': {
        out.push({
          kind: 'burst',
          from: seatAnchor(event.playerId),
          label: 'UNO!',
          tone: 'uno',
          delay: postDealDelay,
          duration: BURST,
        });
        break;
      }
      case 'UNO_PENALTY': {
        out.push({
          kind: 'burst',
          from: seatAnchor(event.playerId),
          label: `Caught! +${event.count}`,
          tone: 'danger',
          delay: postDealDelay,
          duration: BURST,
        });
        break;
      }
      case 'SHUFFLE_DISCARD': {
        out.push({
          kind: 'burst',
          from: 'draw',
          label: 'Reshuffling…',
          tone: 'info',
          delay: postDealDelay,
          duration: BURST,
        });
        break;
      }
      default:
        break;
    }
  }

  return isInitialDeal ? out.map((item) => ({ ...item, initial: true })) : out;
}

/**
 * Watches the store's latest event batch and feeds it into the animation store.
 * Mounted once, near the root.
 */
export function useAnimationQueue(): void {
  const events = useGameStore((store) => store.lastEvents);
  const batchId = useGameStore((store) => store.eventBatchId);
  const phase = useGameStore((store) => store.state.phase);

  useEffect(() => {
    if (events.length === 0) return;
    useAnimationStore.getState().ingest(batchId, buildAnimations(events));
  }, [batchId, events]);

  useEffect(() => {
    if (phase === 'menu') useAnimationStore.getState().clear();
  }, [phase]);
}
