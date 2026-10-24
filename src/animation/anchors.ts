/**
 * Registry of on-screen anchor points (draw pile, discard pile, each seat).
 * Components register their DOM node; the animation layer measures them at play
 * time to fly cards between the right places.
 */
const anchors = new Map<string, HTMLElement>();

export function setAnchor(key: string, el: HTMLElement | null): void {
  if (el) {
    // Don't overwrite existing valid anchor with a hidden/zero-sized element
    const existing = anchors.get(key);
    if (existing && existing !== el) {
      try {
        const existingRect = existing.getBoundingClientRect();
        if (existingRect.width > 0 && existingRect.height > 0) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            return;
          }
        }
      } catch {
        // ignore
      }
    }
    try {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && anchors.has(key)) {
        const existing = anchors.get(key)!;
        try {
          const existingRect = existing.getBoundingClientRect();
          if (existingRect.width > 0 && existingRect.height > 0) {
            return;
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    anchors.set(key, el);
  } else {
    anchors.delete(key);
  }
}

export function seatAnchor(playerId: string): string {
  return playerId === 'human' ? 'human' : `seat:${playerId}`;
}

export interface AnchorRect {
  cx: number;
  cy: number;
  width: number;
  height: number;
}

export function getAnchorRect(key: string | null | undefined): AnchorRect | null {
  if (!key) return null;
  const el = anchors.get(key);
  if (!el) return null;
  try {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  } catch {
    return null;
  }
}
