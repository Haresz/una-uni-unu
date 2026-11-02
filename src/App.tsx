/**
 * App: composition root.
 *
 * Picks the screen (menu / table / win), mounts the three effect hooks
 * (driver, animation queue, sound), and wires store actions to the table's
 * callbacks. No game rules live here.
 */
import { useEffect, useMemo, useState } from 'react';
import { playSound } from './audio/soundManager';
import { AnimationLayer } from './components/AnimationLayer';
import { AudioControls } from './components/AudioControls';
import { ColorPickerModal } from './components/ColorPickerModal';
import { GameTable } from './components/GameTable';
import { StartMenu } from './components/StartMenu';
import { WinScreen } from './components/WinScreen';
import { currentPlayer } from './engine';
import { useAnimationQueue } from './hooks/useAnimationQueue';
import { useDealReveal } from './hooks/useDealReveal';
import { useGameDriver } from './hooks/useGameDriver';
import { useSoundEvents } from './hooks/useSoundEvents';
import { selectDealing, useAnimationStore } from './store/animationStore';
import { selectPlayableIds, useGameStore, type StartOptions } from './store/gameStore';

export default function App() {
  const state = useGameStore((s) => s.state);
  const selectedId = useGameStore((s) => s.selectedId);
  const pendingWildId = useGameStore((s) => s.pendingWildId);
  const animationDealing = useAnimationStore(selectDealing);
  const [startDealing, setStartDealing] = useState(false);
  const dealing = startDealing || animationDealing;

  const startGame = useGameStore((s) => s.startGame);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const selectCard = useGameStore((s) => s.selectCard);
  const confirmWild = useGameStore((s) => s.confirmWild);
  const cancelWild = useGameStore((s) => s.cancelWild);
  const drawCard = useGameStore((s) => s.drawCard);
  const pass = useGameStore((s) => s.pass);
  const callUno = useGameStore((s) => s.callUno);
  const catchUno = useGameStore((s) => s.catchUno);

  useAnimationQueue();
  const dealProgress = useDealReveal();
  useGameDriver();
  useSoundEvents();

  const beginGame = (options: StartOptions) => {
    setStartDealing(true);
    startGame(options);
  };

  useEffect(() => {
    if (animationDealing) setStartDealing(false);
  }, [animationDealing]);

  useEffect(() => {
    if (state.phase === 'menu') setStartDealing(false);
  }, [state.phase]);

  const playableIds = useMemo(() => selectPlayableIds(state), [state]);

  if (state.phase === 'menu') {
    return <StartMenu defaultBotCount={2} defaultStackDrawTwo={false} onStart={beginGame} />;
  }

  const human = state.players[0]!;
  const isHumanTurn = state.phase === 'playing' && currentPlayer(state).id === human.id;
  const canCallUno = !dealing && state.unoPending?.playerId === human.id;
  const catchTargets =
    !dealing && state.unoPending && state.unoPending.playerId !== human.id
      ? [state.unoPending.playerId]
      : [];
  const showDraw = !dealing && isHumanTurn && state.drawnCardId === null;
  const showPass = !dealing && isHumanTurn && state.drawnCardId !== null;

  const winner = state.winnerId
    ? state.players.find((player) => player.id === state.winnerId)
    : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <AnimationLayer />
      <GameTable
        state={state}
        playableIds={playableIds}
        selectedId={selectedId}
        interactive={state.phase === 'playing' && !dealing}
        dealing={dealing}
        dealProgress={dealProgress}
        onSelectCard={selectCard}
        onDraw={drawCard}
        onPass={pass}
        showDraw={showDraw}
        showPass={showPass}
        canCallUno={canCallUno}
        onCallUno={() => callUno(human.id)}
        catchTargets={catchTargets}
        onCatchUno={catchUno}
      />

      <div className="absolute right-2 top-2 z-[60] flex items-center gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
        <AudioControls />
        <button
          type="button"
          onClick={() => {
            playSound('click');
            goToMenu();
          }}
          className="rounded-full bg-black/40 px-2.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/20 hover:bg-black/60 min-h-[40px] min-w-[40px] sm:px-3"
        >
          Menu
        </button>
      </div>

      <ColorPickerModal
        open={pendingWildId !== null}
        onPick={confirmWild}
        onCancel={cancelWild}
      />

      {winner && (
        <WinScreen
          winnerName={winner.name}
          isHuman={winner.id === human.id}
          onPlayAgain={() =>
            beginGame({ botCount: state.config.botCount, stackDrawTwo: state.config.stackDrawTwo })
          }
          onBackToMenu={goToMenu}
        />
      )}
    </div>
  );
}
