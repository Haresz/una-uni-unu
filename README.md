# UNA-UNI-UNU

An original, frontend-only UNO-style card game you play in the browser against
1–3 bots. Match colours and symbols, shed your hand before everyone else — and
never forget to call **UNO**.

> Original artwork and rules. Not affiliated with, or endorsed by, any
> trademarked card game.

## Features

- **Full round vs. bots** built on a pure, deterministic game engine.
- **Seeded RNG** (`mulberry32`) so every deal is reproducible from a seed.
- **House rules**: optional *Stack Draw Two* (answer a Draw Two with your own to
  pass the penalty on), Wild + Wild Draw Four reveal rules, UNO call/catch with
  penalties.
- **Animated table**: cards fly to the discard pile, cards are dealt, and
  Skip/Reverse/UNO moments burst onto screen (Framer Motion).
- **Sound effects** with mute + volume controls that persist between sessions.
- **Responsive, keyboard-accessible** UI.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript (strict)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://zustand-demo.pmnd.rs/) for state
- [Framer Motion](https://www.framer.com/motion/) for animation
- [Vitest](https://vitest.dev/) for tests

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check only |
| `npm run sfx:placeholders` | Regenerate the placeholder sound files |
| `npm run gen:favicons` | Regenerate PNG/ICO app icons from `public/favicon.svg` |

## Project structure

```
src/
  engine/        Pure game engine (types, RNG, deck, rules, reducer, bot)
  store/         Zustand stores (game, animation, audio)
  hooks/         useGameDriver, useAnimationQueue, useSoundEvents
  components/    UI: cards, table, menus, animation layer, controls
  animation/     Anchor registry + animation descriptor types
  audio/         Sound manifest + native Audio sound manager
scripts/         Placeholder sound generator
public/sounds/   Sound effect files (replaceable)
```

The engine is completely decoupled from React: `reduce(state, action)` returns
the next state plus a list of `GameEvent`s. The UI, the animation queue and the
sound layer each subscribe to those events independently.

## App icon

`public/favicon.svg` is the source of truth — the four-colour wild emblem on a
felt tile. Rasterized fallbacks (`favicon.ico`, `favicon-16/32/48.png`,
`apple-touch-icon.png`, `icon-192/512.png`) and the web app manifest are
generated from it:

```bash
npm run gen:favicons
```

Edit the SVG, re-run the script, and every icon updates.

## Sound effects

Sounds live in `public/sounds/` and are declared once in
[`src/audio/sfx.ts`](src/audio/sfx.ts). The repo ships with **audible placeholder
tones** so every event is easy to identify while playing.

| File | Plays when |
| --- | --- |
| `click.wav` | A button is pressed or a card is selected |
| `play.wav` | A card is played (including the opening flip) |
| `draw.wav` | A card is drawn |
| `deal.wav` | Cards are dealt at the start of a round (throttled) |
| `shuffle.wav` | The discard pile is reshuffled into the draw pile |
| `skip.wav` | A Skip is played |
| `reverse.wav` | A Reverse is played |
| `wild.wav` | A Wild colour is chosen |
| `uno.wav` | A player calls UNO |
| `penalty.wav` | A draw penalty or a caught player |
| `turn.wav` | It becomes your turn |
| `win.wav` | You win the round |
| `lose.wav` | A bot wins the round |

### Replacing the sounds (or generating the placeholders)

```bash
npm run sfx:placeholders   # writes 13 tone WAVs into public/sounds/
```

Drop your own clips into `public/sounds/`, keeping the filenames above. To use a
different format, change the single `AUDIO_EXT` constant in `src/audio/sfx.ts`
(e.g. `'mp3'`) and provide matching files. Missing files fail silently, so the
game keeps working either way.

## Rules

- Match the top of the discard pile by **colour** or **symbol/number**; Wilds can
  be played on anything.
- **Skip** skips the next player. **Reverse** flips direction (acts as a Skip in a
  two-player game). **Draw Two** makes the next player draw 2. **Wild Draw Four**
  makes the next player draw 4.
- With *Stack Draw Two* enabled, a player facing a Draw Two may answer with their
  own Draw Two to pass the growing penalty along.
- When you play your second-to-last card you must call **UNO** before the next
  player acts — otherwise an opponent can **Catch** you and you draw 2.
- First player to empty their hand wins the round.

## Deployment

The app is a static SPA. Build with `npm run build` and deploy `dist/` to any
static host (Vercel, Netlify, GitHub Pages, …).
