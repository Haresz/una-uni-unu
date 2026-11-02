import { useEffect, useState } from 'react';
import { buildDealTimeline } from '../animation/dealTimeline';
import type { DealRevealProgress } from '../animation/types';
import { useGameStore } from '../store/gameStore';

const EMPTY_PROGRESS: DealRevealProgress = {
  visibleHumanIds: new Set(),
  revealedHumanIds: new Set(),
  botCounts: {},
};

interface DealRevealState {
  batchId: number;
  progress: DealRevealProgress;
}

const EMPTY_STATE: DealRevealState = {
  batchId: -1,
  progress: EMPTY_PROGRESS,
};

export function useDealReveal(): DealRevealProgress {
  const events = useGameStore((store) => store.lastEvents);
  const batchId = useGameStore((store) => store.eventBatchId);
  const phase = useGameStore((store) => store.state.phase);
  const [state, setState] = useState<DealRevealState>(EMPTY_STATE);

  useEffect(() => {
    if (phase === 'menu') {
      setState(EMPTY_STATE);
      return;
    }

    const timeline = buildDealTimeline(events);
    if (!timeline || typeof window === 'undefined') return;

    const timers: number[] = [];
    setState({ batchId, progress: EMPTY_PROGRESS });

    for (const step of timeline.steps) {
      const timer = window.setTimeout(() => {
        setState((previous) => {
          if (previous.batchId !== batchId) return previous;
          const progress = previous.progress;

          if (step.kind === 'flip') {
            const revealedHumanIds = new Set(progress.revealedHumanIds);
            revealedHumanIds.add(step.cardId);
            return {
              batchId,
              progress: { ...progress, revealedHumanIds },
            };
          }

          if (step.playerId === 'human') {
            const visibleHumanIds = new Set(progress.visibleHumanIds);
            visibleHumanIds.add(step.cardId);
            return {
              batchId,
              progress: { ...progress, visibleHumanIds },
            };
          }

          const botCounts = {
            ...progress.botCounts,
            [step.playerId]: (progress.botCounts[step.playerId] ?? 0) + 1,
          };
          return {
            batchId,
            progress: { ...progress, botCounts },
          };
        });
      }, step.at);
      timers.push(timer);
    }

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [batchId, events, phase]);

  return state.batchId === batchId ? state.progress : EMPTY_PROGRESS;
}
