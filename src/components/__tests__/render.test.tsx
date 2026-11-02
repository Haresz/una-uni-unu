import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DirectionIndicator } from '../DirectionIndicator';
import { GameTable } from '../GameTable';
import { StartMenu } from '../StartMenu';
import { CardFace } from '../cards/CardFace';
import { CardBack } from '../cards/CardBack';
import { makeDemoState } from '../../dev/demo';
import type { Card } from '../../engine/types';

const redFive: Card = { id: 't-red-5', kind: 'number', color: 'red', value: 5 };
const wildFour: Card = { id: 't-w4', kind: 'wild_draw_four', color: null, value: null };

describe('card SVG components render', () => {
  it('renders a number card face with its value', () => {
    const html = renderToString(<CardFace card={redFive} className="h-full w-full" />);
    expect(html).toContain('<svg');
    expect(html).toContain('>5<');
    expect(html).toContain('var(--card-red)');
  });

  it('renders a wild draw four face', () => {
    const html = renderToString(<CardFace card={wildFour} className="h-full w-full" />);
    expect(html).toContain('+4');
  });

  it('renders the card back', () => {
    const html = renderToString(<CardBack className="h-full w-full" />);
    expect(html).toContain('<svg');
    expect(html).toContain('pattern');
  });
});

describe('StartMenu', () => {
  it('renders the setup controls', () => {
    const html = renderToString(<StartMenu onStart={() => {}} />);
    expect(html).toContain('UNA-UNI-UNU');
    expect(html).toContain('Stack Draw Two');
    expect(html).toContain('Play');
  });
});

describe('DirectionIndicator', () => {
  it('uses the active card color and clockwise arrowheads', () => {
    const html = renderToString(<DirectionIndicator direction={1} color="red" />);
    expect(html).toContain('Clockwise');
    expect(html).toContain('#e0483c');
    expect(html).toContain('M 17.11 38.03 A 35 35 0 0 1 82.89 38.03');
  });

  it('keeps the active color while reversing the arrowheads', () => {
    const html = renderToString(<DirectionIndicator direction={-1} color="blue" />);
    expect(html).toContain('Counterclockwise');
    expect(html).toContain('ccw');
    expect(html).toContain('#2f6fdb');
    expect(html).toContain('M 82.89 38.03 A 35 35 0 0 0 17.11 38.03');
  });
});

describe('GameTable', () => {
  it('renders a full table without throwing', () => {
    const state = makeDemoState(2);
    const html = renderToString(
      <GameTable state={state} playableIds={new Set()} canCallUno catchTargets={['bot1']} />,
    );
    // Sanity: opponents, piles and the human hand are all present.
    expect(html).toContain('Bot 1');
    expect(html).toContain('Draw');
    expect(html).toContain('Discard');
    expect(html).toContain('Your turn');
  });
});
