import { useState } from 'react';
import { playSound } from '../audio/soundManager';
import { COLOR_ORDER, CARD_COLOR_VAR } from './cards/cardTheme';

export interface StartMenuOptions {
  botCount: number;
  stackDrawTwo: boolean;
}

export interface StartMenuProps {
  defaultBotCount?: number;
  defaultStackDrawTwo?: boolean;
  onStart: (options: StartMenuOptions) => void;
}

const BOT_CHOICES = [1, 2, 3];

export function StartMenu({
  defaultBotCount = 2,
  defaultStackDrawTwo = false,
  onStart,
}: StartMenuProps) {
  const [botCount, setBotCount] = useState(defaultBotCount);
  const [stackDrawTwo, setStackDrawTwo] = useState(defaultStackDrawTwo);

  return (
    <div className="flex min-h-full w-full items-center justify-center p-6">
      <div className="felt-texture w-full max-w-md rounded-[2rem] bg-emerald-950/50 p-7 shadow-2xl ring-1 ring-white/10 backdrop-blur">
        <div className="flex items-center justify-center gap-1.5">
          {COLOR_ORDER.map((color, index) => (
            <span
              key={color}
              className="h-10 w-7 rounded-md ring-2 ring-black/20"
              style={{
                backgroundColor: CARD_COLOR_VAR[color],
                transform: `rotate(${(index - 1.5) * 12}deg)`,
              }}
            />
          ))}
        </div>

        <h1 className="mt-5 text-center text-4xl font-black tracking-tight text-white">
          UNA-UNI-UNU
        </h1>
        <p className="mt-2 text-center text-sm text-white/65">
          A colourful card duel against clever bots. Match colours and symbols,
          empty your hand first — and never forget to call UNO.
        </p>

        <div className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50">
            Opponents
          </h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {BOT_CHOICES.map((choice) => {
              const active = choice === botCount;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setBotCount(choice);
                  }}
                  className={`rounded-2xl px-3 py-3 text-center font-bold transition ${
                    active
                      ? 'bg-amber-400 text-emerald-950 ring-2 ring-amber-200'
                      : 'bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-2xl">{choice}</span>
                  <span className="text-[11px] uppercase tracking-wide">
                    {choice === 1 ? 'bot' : 'bots'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            role="switch"
            aria-checked={stackDrawTwo}
            onClick={() => {
              playSound('click');
              setStackDrawTwo((value) => !value);
            }}
            className="flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-left ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <span>
              <span className="block font-semibold text-white">Stack Draw Two</span>
              <span className="block text-xs text-white/55">
                Answer a Draw Two with your own to pass the penalty on.
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                stackDrawTwo ? 'bg-amber-400' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  stackDrawTwo ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            playSound('click');
            onStart({ botCount, stackDrawTwo });
          }}
          className="mt-7 w-full rounded-full bg-amber-400 px-6 py-4 text-lg font-black uppercase tracking-wide text-emerald-950 shadow-[0_8px_0_rgba(0,0,0,0.35)] transition hover:bg-amber-300 active:translate-y-1 active:shadow-[0_4px_0_rgba(0,0,0,0.35)]"
        >
          Play
        </button>

        <p className="mt-4 text-center text-[11px] text-white/40">
          Original artwork & rules. Not affiliated with any trademarked card game.
        </p>
      </div>
    </div>
  );
}
