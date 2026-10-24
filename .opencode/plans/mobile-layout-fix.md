# Plan: Mobile Layout Fix for UNO Game

## Problem Summary
On mobile devices (390-490px), UI elements collide: header (volume + Menu) overlaps with bot labels/penalty indicators, "YOU", "Draw", "UNO!", "CLOCKWISE" labels stack, rightmost player cards go out of viewport, penalty indicators can overlap Menu on tight layouts.

## Solution Overview
Rework layout using CSS Grid/Flex with mobile breakpoints (<=480px) to match Classic Bridge style - thin side strips for opponents, larger center area and hand area, make draw pile tappable, hide unnecessary labels.

## Files to Modify

### 1. index.html
- Add `maximum-scale=1.0, user-scalable=no` to viewport meta for better mobile control

### 2. src/index.css
- Add CSS variables for layout (`--side-strip-w`, card sizes)
- Add mobile media queries (max-width: 480px)
- Add short screen media query (max-height: 700px)
- Use dvh with vh fallback
- Add safe area padding support

### 3. src/App.tsx
- Restructure header area

### 4. src/components/GameTable.tsx
- Major restructure: use CSS grid layout for mobile
- Bot zones in side strips within table area
- Hide "YOU" badge on mobile
- Hide separate Draw button on mobile
- Adjust UNO button placement

### 5. src/components/OpponentZone.tsx
- Reduce to thin strip layout on mobile
- Combine name + card count
- Make label vertical if needed
- Move penalty indicators inside container

### 6. src/components/TablePiles.tsx
- Make Draw pile clickable as button on mobile when drawable
- Hide/shrink labels on mobile
- Add ARIA labels

### 7. src/components/DirectionIndicator.tsx
- Arrow only on mobile

### 8. src/components/PlayerHand.tsx
- Horizontal scroll with snap, safe area padding
- Ensure overflow visible for raised cards

### 9. src/components/UnoButton.tsx
- Smaller size on mobile, min 44x44px

## Implementation Details

- Use `@media (max-width: 480px)` for mobile styles
- Use `@media (max-height: 700px)` for short screens
- Use CSS Grid/Flex, avoid absolute positioning for colliding elements
- Use dvh units
- Touch targets >= 44x44px
- Draw pile becomes `<button>` on mobile when it's player's turn and can draw
