import type { GameState, Player } from '../engine/types';
import { playSound } from '../audio/soundManager';
import { setAnchor } from '../animation/anchors';
import { DirectionIndicator } from './DirectionIndicator';
import { OpponentZone, type SeatPosition } from './OpponentZone';
import { PlayerHand } from './PlayerHand';
import { TablePiles } from './TablePiles';
import { ToastStack, type ToastItem } from './Toast';
import { TurnBadge } from './TurnBadge';
import { UnoButton } from './UnoButton';

export interface GameTableProps {
  state: GameState;
  playableIds?: ReadonlySet<string>;
  selectedId?: string | null;
  interactive?: boolean;
  onSelectCard?: (cardId: string) => void;
  onCallUno?: () => void;
  onCatchUno?: (targetId: string) => void;
  onDraw?: () => void;
  onPass?: () => void;
  showDraw?: boolean;
  showPass?: boolean;
  canCallUno?: boolean;
  catchTargets?: string[];
  thinkingPlayerId?: string | null;
  toasts?: ToastItem[];
  className?: string;
}

function seatPositions(botCount: number): SeatPosition[] {
  if (botCount <= 1) return ['top'];
  if (botCount === 2) return ['left', 'right'];
  return ['left', 'top', 'right'];
}

const POSITION_CLASS: Record<SeatPosition, string> = {
  top: 'absolute left-1/2 top-4 -translate-x-1/2',
  left: 'absolute left-2 top-1/2 -translate-y-1/2 sm:left-6',
  right: 'absolute right-2 top-1/2 -translate-y-1/2 sm:right-6',
};

export function GameTable({
  state,
  playableIds,
  selectedId = null,
  interactive = true,
  onSelectCard,
  onCallUno,
  onCatchUno,
  onDraw,
  onPass,
  showDraw = false,
  showPass = false,
  canCallUno = false,
  catchTargets = [],
  thinkingPlayerId = null,
  toasts = [],
  className = '',
}: GameTableProps) {
  const human = state.players[0]!;
  const bots = state.players.filter((player) => player.isBot);
  const positions = seatPositions(bots.length);
  const currentPlayer: Player = state.players[state.currentPlayerIndex]!;
  const isHumanTurn = currentPlayer.id === human.id;

  return (
    <div
      className={`felt-texture relative flex h-full w-full flex-col overflow-hidden ${className}`}
    >
      {/* Opponents */}
      {bots.map((bot, index) => (
        <div
          key={bot.id}
          ref={(el) => setAnchor(`seat:${bot.id}`, el)}
          className={POSITION_CLASS[positions[index] ?? 'top']}
        >
          <OpponentZone
            name={bot.name}
            count={bot.hand.length}
            position={positions[index] ?? 'top'}
            isTurn={currentPlayer.id === bot.id}
            thinking={thinkingPlayerId === bot.id}
          />
        </div>
      ))}

      {/* Centre of the table */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
        <TurnBadge
          text={isHumanTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}
          tone={isHumanTurn ? 'you' : 'bot'}
          pulse={!isHumanTurn}
        />
        <TablePiles
          drawCount={state.drawPile.length}
          discardStack={state.discardPile}
          activeColor={state.activeColor}
          pendingDraw={state.pendingDraw}
        />
        <DirectionIndicator direction={state.direction} />
      </div>

      {/* Toasts */}
      <ToastStack items={toasts} className="absolute left-1/2 top-2 z-40 -translate-x-1/2" />

      {/* Player area */}
      <div className="relative z-30 mt-auto flex flex-col items-center">
        <div className="mb-1 flex flex-wrap items-center justify-center gap-2">
          <TurnBadge text="You" tone={isHumanTurn ? 'you' : 'neutral'} />
          {catchTargets.map((targetId) => {
            const target = state.players.find((player) => player.id === targetId);
            if (!target) return null;
            return (
              <UnoButton
                key={targetId}
                variant="catch"
                onClick={
                  onCatchUno
                    ? () => {
                        playSound('click');
                        onCatchUno(targetId);
                      }
                    : undefined
                }
              >
                Catch {target.name}!
              </UnoButton>
            );
          })}
          {showDraw && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onDraw?.();
              }}
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              Draw
            </button>
          )}
          {showPass && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onPass?.();
              }}
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              Pass
            </button>
          )}
          <UnoButton
            variant="call"
            disabled={!canCallUno}
            onClick={
              onCallUno
                ? () => {
                    playSound('click');
                    onCallUno();
                  }
                : undefined
            }
          />
        </div>
        <PlayerHand
          cards={human.hand}
          playableIds={playableIds}
          selectedId={selectedId}
          interactive={interactive && isHumanTurn}
          onSelect={
            onSelectCard
              ? (cardId) => {
                  playSound('click');
                  onSelectCard(cardId);
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
