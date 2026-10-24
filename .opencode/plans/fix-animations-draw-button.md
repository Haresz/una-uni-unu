# Plan: Fix Animation Anchors and Revert Mobile Draw Button

## Problem 1: Animations go to top-left/stack
**Root cause:** In my new GameTable layout, I render BOTH desktop and mobile versions of elements simultaneously:
- Bot seats rendered twice (desktop absolute + mobile grid) with same anchor keys
- TablePiles rendered twice (desktop overlay + mobile grid) with same anchor keys
- When CSS `display: none` is used (via `hidden`, `sm:hidden`), `getBoundingClientRect()` returns zeros
- Both sets of refs call `setAnchor()` - the second set (often the hidden one) overwrites with bad positions (all zeros)

This causes animations to go to (0,0) or behave incorrectly.

**Fix:**
- Only render and set anchors for the active layout (or use conditional rendering based on breakpoints)
- OR in `setAnchor`, only set if the element has non-zero dimensions / is actually visible
- OR restructure so each anchor key is only set once by the visible element
- Better: render different layouts in different components or use responsive conditional rendering in a cleaner way

Options:
1. In `setAnchor`, check if rect has non-zero dimensions before setting: `const rect = el.getBoundingClientRect(); if (rect.width === 0 && rect.height === 0) return;` This prevents overwriting good anchors with zero rects from hidden elements
2. Restructure GameTable to not render both layouts simultaneously
3. Use different anchor keys per layout and translate

Option 1 is safer and less invasive - modifies anchor logic.

## Problem 2: Revert draw button on mobile
**Current behavior:** On mobile, draw pile becomes a tappable button when it's player's turn and can draw (per requirements). 
**User wants:** Put the separate Draw button back for mobile.

**Fix:**
- In GameTable mobile layout, show the separate Draw button (like desktop) when `showDraw` is true
- Make the draw pile not necessarily a button on mobile, or keep it but also show the button
- The user says "untuk tombol draw di di device mobile di kembalikan saja" - revert to having the separate Draw button on mobile

Looking at original: in GameTable line ~138-149, showDraw button was shown. In my modified version I hid it with `hidden sm:inline-flex`. I need to show it on mobile too (or differently).

Also need to check - does the tap-to-draw on pile still need to work? The requirements said "Menarik kartu dilakukan dengan tap pada tumpukan kartu Draw" for mobile. But user says revert the button. Maybe they want both? Or just the button back. Let us look up the exact request again: "untuk tombol draw di di device mobile di kembalikan saja buatkan saya plan untuk mengatasi dua hal tersebut" - so revert draw button to how it was (show separate button on mobile). Keep tap-to-draw? Or just the button. Let us be flexible.

## Files to Change

### For animations/anchors:
1. `src/animation/anchors.ts` - Guard against setting anchors on elements with zero dimensions
2. Possibly `src/components/GameTable.tsx` - restructure to avoid duplicate rendering, or ensure correct order
3. Possibly `src/components/TablePiles.tsx` - same issue with duplicate rendering

### For draw button:
1. `src/components/GameTable.tsx` - show Draw button on mobile when showDraw
2. `src/components/TablePiles.tsx` - maybe adjust mobile behavior

## Implementation Plan

### Fix 1: Anchor guard
```ts
export function setAnchor(key: string, el: HTMLElement | null): void {
  if (el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return; // Don't set anchor for hidden elements
    anchors.set(key, el);
  } else {
    anchors.delete(key);
  }
}
```
This prevents hidden elements from overwriting valid anchors.

### Fix 2: Revert draw button
In GameTable, change the Draw button to show on mobile:
```tsx
{showDraw && (
  <button
    type="button"
    onClick={() => {
      playSound('click');
      onDraw?.();
    }}
    className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25 min-h-[44px]"
  >
    Draw
  </button>
)}
```
Remove `hidden sm:inline-flex`, make it visible on all sizes. Also ensure it has proper touch target size.

Also maybe keep tap-to-draw on pile as optional, but prioritize button.
