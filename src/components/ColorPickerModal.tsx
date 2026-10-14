import type { CardColor } from '../engine/types';
import { playSound } from '../audio/soundManager';
import { COLOR_LABEL, COLOR_ORDER, CARD_COLOR_VAR } from './cards/cardTheme';

export interface ColorPickerModalProps {
  open: boolean;
  onPick: (color: CardColor) => void;
  onCancel?: () => void;
}

/** Modal used when a Wild is played and a colour must be declared. */
export function ColorPickerModal({ open, onPick, onCancel }: ColorPickerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-emerald-950/90 p-6 shadow-2xl ring-1 ring-white/10">
        <h2 className="text-center text-xl font-bold text-white">Choose a colour</h2>
        <p className="mt-1 text-center text-sm text-white/60">
          Your Wild card takes on this colour.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {COLOR_ORDER.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                playSound('click');
                onPick(color);
              }}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <span
                className="h-14 w-14 rounded-full ring-4 ring-white/20 transition group-hover:ring-white/60"
                style={{ backgroundColor: CARD_COLOR_VAR[color] }}
              />
              <span className="text-sm font-semibold text-white">{COLOR_LABEL[color]}</span>
            </button>
          ))}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onCancel();
            }}
            className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white/60 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
