/**
 * Registry of on-screen anchor points (draw pile, discard pile, each seat).
 * Components register their DOM node; the animation layer measures them at play
 * time to fly cards between the right places.
 */
const anchors = new Map<string, HTMLElement>();

export function setAnchor(key: string, el: HTMLElement | null): void {
  if (el) anchors.set(key, el);
  else anchors.delete(key);
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
  const rect = el.getBoundingClientRect();
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
  };
}
