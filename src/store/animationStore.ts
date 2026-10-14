import { create } from 'zustand';
import type { AnimationDescriptor, AnimationItem } from '../animation/types';

interface AnimationStore {
  items: AnimationItem[];
  /** Highest processed game-event batch, guards against double-ingest. */
  lastBatchId: number;
  ingest: (batchId: number, incoming: AnimationDescriptor[]) => void;
  clear: () => void;
  finish: (id: number) => void;
}

let nextId = 1;

export const useAnimationStore = create<AnimationStore>((set, get) => ({
  items: [],
  lastBatchId: 0,

  ingest: (batchId, incoming) => {
    if (incoming.length === 0) return;
    if (batchId <= get().lastBatchId) return;
    const withIds: AnimationItem[] = incoming.map((item) => ({ ...item, id: nextId++ }));
    set({ items: [...get().items, ...withIds], lastBatchId: batchId });
    for (const item of withIds) {
      const lifetime = item.delay + item.duration + 120;
      window.setTimeout(() => get().finish(item.id), lifetime);
    }
  },

  clear: () => set({ items: [] }),

  finish: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
}));

/** True while any animation is in flight; the driver pauses until it clears. */
export function selectAnimationsBusy(store: AnimationStore): boolean {
  return store.items.length > 0;
}
