import { playSound } from '../audio/soundManager';

export interface WinScreenProps {
  winnerName: string;
  isHuman: boolean;
  onPlayAgain: () => void;
  onBackToMenu?: () => void;
}

export function WinScreen({ winnerName, isHuman, onPlayAgain, onBackToMenu }: WinScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-emerald-900 to-emerald-950 p-8 text-center shadow-2xl ring-1 ring-white/10">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">
          {isHuman ? 'Victory' : 'Round over'}
        </p>
        <h2 className="mt-2 text-4xl font-black text-white">
          {isHuman ? 'You win!' : `${winnerName} wins`}
        </h2>
        <p className="mt-3 text-white/70">
          {isHuman
            ? 'You shed every card before the bots could catch you.'
            : 'Better luck next round — those bots are quick.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onPlayAgain();
            }}
            className="rounded-full bg-amber-400 px-6 py-3 font-bold text-emerald-950 shadow-[0_6px_0_rgba(0,0,0,0.35)] transition hover:bg-amber-300 active:translate-y-0.5 active:shadow-[0_3px_0_rgba(0,0,0,0.35)]"
          >
            Play again
          </button>
          {onBackToMenu && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onBackToMenu();
              }}
              className="rounded-full bg-white/10 px-6 py-3 font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Main menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
