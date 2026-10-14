/**
 * Tiny deterministic PRNG (mulberry32).
 *
 * The state is a single 32-bit integer that lives inside `GameState`, which
 * lets the reducer remain a pure function while still supporting shuffling and
 * random bot choices. Tests can pass an explicit seed for reproducibility.
 */

export type RngState = number;

export function seedFromNumber(seed: number): RngState {
  // Coerce to unsigned 32-bit; avoid a zero-only state.
  const s = seed >>> 0;
  return s === 0 ? 0x9e3779b9 : s;
}

export interface RngStep {
  value: number;
  state: RngState;
}

/** Advance the PRNG and return a float in [0, 1) plus the next state. */
export function nextRandom(state: RngState): RngStep {
  let a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a >>> 0 };
}

/** Integer in [0, maxExclusive). */
export function nextInt(state: RngState, maxExclusive: number): { value: number; state: RngState } {
  const step = nextRandom(state);
  if (maxExclusive <= 0) {
    return { value: 0, state: step.state };
  }
  return { value: Math.floor(step.value * maxExclusive), state: step.state };
}

/**
 * Fisher-Yates shuffle. Returns a new array and the resulting PRNG state; the
 * input array is left untouched.
 */
export function shuffle<T>(items: readonly T[], state: RngState): { result: T[]; state: RngState } {
  const result = items.slice();
  let rng = state;
  for (let i = result.length - 1; i > 0; i--) {
    const step = nextInt(rng, i + 1);
    rng = step.state;
    const j = step.value;
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return { result, state: rng };
}
