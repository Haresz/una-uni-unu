/**
 * GameTable: the visual layout of a round.
 *
 * Positions the bot seats, the central piles, and the player area. It receives
 * everything it needs as props (playable ids, selection, flags) and knows
 * nothing about the rules themselves.
 */
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
  top: 'absolute left-1/2 top-4 -translate-x-1/2 max-md:static max-md:translate-x-0',
  left: 'absolute left-2 top-1/2 -translate-y-1/2 sm:left-6 max-md:static max-md:translate-y-0',
  right: 'absolute right-2 top-1/2 -translate-y-1/2 sm:right-6 max-md:static max-md:translate-y-0',
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
      className={`felt-texture relative grid h-[100dvh] w-full grid-rows-[auto_1fr_auto] overflow-hidden ${className}`}
    >
      {/* Header spacer for menu/audio */}
      <div className="h-12 w-full sm:h-14" />

      {/* Table area */}
      <div className="relative flex min-h-0 w-full items-center justify-center">
        {/* Opponents - desktop absolute positioning, mobile in grid */}
        {bots.map((bot, index) => {
          const pos = positions[index] ?? 'top';
          // On mobile, render differently via CSS
          return (
            <div
              key={bot.id}
              ref={(el) => setAnchor(`seat:${bot.id}`, el)}
              className={`${POSITION_CLASS[pos]} hidden sm:block`}
            >
              <OpponentZone
                name={bot.name}
                count={bot.hand.length}
                position={pos}
                isTurn={currentPlayer.id === bot.id}
                thinking={thinkingPlayerId === bot.id}
              />
            </div>
          );
        })}

        {/* Mobile layout: grid with side strips */}
        <div className="grid h-full w-full grid-cols-[var(--side-strip-w,28px)_1fr_var(--side-strip-w,28px)] items-center sm:hidden">
          {/* Left strip */}
          <div className="flex h-full items-center justify-center">
            {bots.map((bot, index) => {
              const pos = positions[index] ?? 'top';
              if (pos !== 'left') return null;
              return (
                <div
                  key={bot.id}
                  ref={(el) => setAnchor(`seat:${bot.id}`, el)}
                  className="w-full"
                >
                  <OpponentZone
                    name={bot.name}
                    count={bot.hand.length}
                    position={pos}
                    isTurn={currentPlayer.id === bot.id}
                    thinking={thinkingPlayerId === bot.id}
                    mobile
                  />
                </div>
              );
            })}
          </div>

          {/* Center */}
          <div className="relative flex h-full flex-col items-center justify-center gap-2">
            {/* Top bot if exists */}
            {bots.map((bot, index) => {
              const pos = positions[index] ?? 'top';
              if (pos !== 'top') return null;
              return (
                <div
                  key={bot.id}
                  ref={(el) => setAnchor(`seat:${bot.id}`, el)}
                  className="mb-2"
                >
                  <OpponentZone
                    name={bot.name}
                    count={bot.hand.length}
                    position={pos}
                    isTurn={currentPlayer.id === bot.id}
                    thinking={thinkingPlayerId === bot.id}
                    mobile
                  />
                </div>
              );
            })}

            <TurnBadge
              text={isHumanTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}
              tone={isHumanTurn ? 'you' : 'bot'}
              pulse={!isHumanTurn}
              className="scale-90"
            />
            <TablePiles
              drawCount={state.drawPile.length}
              discardStack={state.discardPile}
              activeColor={state.activeColor}
              pendingDraw={state.pendingDraw}
              mobile
              canDraw={showDraw && interactive}
              onDraw={onDraw}
            />
            <DirectionIndicator direction={state.direction} mobile />
          </div>

          {/* Right strip */}
          <div className="flex h-full items-center justify-center">
            {bots.map((bot, index) => {
              const pos = positions[index] ?? 'top';
              if (pos !== 'right') return null;
              return (
                <div
                  key={bot.id}
                  ref={(el) => setAnchor(`seat:${bot.id}`, el)}
                  className="w-full"
                >
                  <OpponentZone
                    name={bot.name}
                    count={bot.hand.length}
                    position={pos}
                    isTurn={currentPlayer.id === bot.id}
                    thinking={thinkingPlayerId === bot.id}
                    mobile
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Centre of the table - desktop */}
        <div className="pointer-events-none absolute inset-0 hidden flex-col items-center justify-center gap-4 sm:flex">
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
            mobile={false}
            canDraw={false}
          />
          <DirectionIndicator direction={state.direction} mobile={false} />
        </div>
      </div>

      {/* Toasts */}
      <ToastStack items={toasts} className="absolute left-1/2 top-14 z-40 -translate-x-1/2 sm:top-16" />

      {/* Player area */}
      <div className="relative z-30 flex flex-col items-center pb-[env(safe-area-inset-bottom,4px)]">
        <div className="mb-1 flex flex-wrap items-center justify-center gap-2">
          <TurnBadge text="You" tone={isHumanTurn ? 'you' : 'neutral'} className="hidden sm:inline-flex" />
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
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-lg"
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
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25 min-h-[44px] min-w-[44px]"
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
            className="min-h-[44px] min-w-[44px] px-4 py-2 text-base sm:px-6 sm:py-3 sm:text-lg"
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
