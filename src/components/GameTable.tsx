import { useCallback } from 'react';
import type { Card as CardModel, CardColor, Direction, GameState, Player } from '../engine/types';
import { playSound } from '../audio/soundManager';
import { setAnchor } from '../animation/anchors';
import { DirectionIndicator } from './DirectionIndicator';
import { OpponentZone, type SeatPosition } from './OpponentZone';
import { PlayerHand } from './PlayerHand';
import { TablePiles } from './TablePiles';
import { ToastStack, type ToastItem } from './Toast';
import { TurnBadge, type TurnTone } from './TurnBadge';
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

interface SeatProps {
  player: Player;
  position: SeatPosition;
  isTurn: boolean;
  thinking: boolean;
  mobile: boolean;
}

function Seat({ player, position, isTurn, thinking, mobile }: SeatProps) {
  const anchorRef = useCallback(
    (el: HTMLDivElement | null) => setAnchor(`seat:${player.id}`, el),
    [player.id],
  );

  return (
    <div ref={anchorRef} className="flex w-full items-center justify-center">
      <OpponentZone
        name={player.name}
        count={player.hand.length}
        position={position}
        isTurn={isTurn}
        thinking={thinking}
        mobile={mobile}
      />
    </div>
  );
}

interface OpponentSeatsProps {
  bots: Player[];
  positions: SeatPosition[];
  currentPlayerId: string;
  thinkingPlayerId: string | null;
  region: SeatPosition;
  mobile: boolean;
}

function OpponentSeats({
  bots,
  positions,
  currentPlayerId,
  thinkingPlayerId,
  region,
  mobile,
}: OpponentSeatsProps) {
  const seats = bots
    .map((bot, index) => ({ bot, position: positions[index] ?? 'top' }))
    .filter((seat) => seat.position === region);

  if (seats.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {seats.map(({ bot, position }) => (
        <Seat
          key={bot.id}
          player={bot}
          position={position}
          isTurn={currentPlayerId === bot.id}
          thinking={thinkingPlayerId === bot.id}
          mobile={mobile}
        />
      ))}
    </div>
  );
}

interface TableCenterProps {
  drawCount: number;
  discardStack: CardModel[];
  activeColor: CardColor;
  pendingDraw: number;
  direction: Direction;
  turnText: string;
  turnTone: TurnTone;
  pulse: boolean;
  mobile: boolean;
  canDraw: boolean;
  onDraw?: () => void;
}

function TableCenter({
  drawCount,
  discardStack,
  activeColor,
  pendingDraw,
  direction,
  turnText,
  turnTone,
  pulse,
  mobile,
  canDraw,
  onDraw,
}: TableCenterProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 sm:gap-4">
      <TurnBadge
        text={turnText}
        tone={turnTone}
        pulse={pulse}
        className={mobile ? 'scale-90' : ''}
      />
      <div className="relative flex items-center justify-center">
        <DirectionIndicator
          direction={direction}
          mobile={mobile}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
        <div className="relative z-10">
          <TablePiles
            drawCount={drawCount}
            discardStack={discardStack}
            activeColor={activeColor}
            pendingDraw={pendingDraw}
            mobile={mobile}
            canDraw={canDraw}
            onDraw={onDraw}
          />
        </div>
      </div>
    </div>
  );
}

interface PlayerControlsProps {
  players: Player[];
  catchTargets: string[];
  showDraw: boolean;
  showPass: boolean;
  canCallUno: boolean;
  isHumanTurn: boolean;
  onCatchUno?: (targetId: string) => void;
  onDraw?: () => void;
  onPass?: () => void;
  onCallUno?: () => void;
}

function PlayerControls({
  players,
  catchTargets,
  showDraw,
  showPass,
  canCallUno,
  isHumanTurn,
  onCatchUno,
  onDraw,
  onPass,
  onCallUno,
}: PlayerControlsProps) {
  return (
    <div className="mb-1 flex flex-wrap items-center justify-center gap-2">
      <TurnBadge text="You" tone={isHumanTurn ? 'you' : 'neutral'} className="hidden sm:inline-flex" />
      {catchTargets.map((targetId) => {
        const target = players.find((player) => player.id === targetId);
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
  );
}

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
  const turnText = isHumanTurn ? 'Your turn' : `${currentPlayer.name}'s turn`;
  const turnTone: TurnTone = isHumanTurn ? 'you' : 'bot';

  return (
    <div
      className={`felt-texture relative grid h-[100dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden ${className}`}
    >
      <div className="relative flex min-h-[64px] w-full items-center justify-center pt-4 sm:min-h-[100px]">
        <div className="hidden sm:flex">
          <OpponentSeats
            bots={bots}
            positions={positions}
            currentPlayerId={currentPlayer.id}
            thinkingPlayerId={thinkingPlayerId}
            region="top"
            mobile={false}
          />
        </div>
        <div className="flex sm:hidden">
          <OpponentSeats
            bots={bots}
            positions={positions}
            currentPlayerId={currentPlayer.id}
            thinkingPlayerId={thinkingPlayerId}
            region="top"
            mobile
          />
        </div>
      </div>

      <div className="relative flex min-h-0 w-full items-stretch justify-between">
        <div className="flex w-[var(--side-strip-w,28px)] items-center justify-start pl-1 sm:w-[100px] sm:pl-2">
          <div className="hidden sm:flex">
            <OpponentSeats
              bots={bots}
              positions={positions}
              currentPlayerId={currentPlayer.id}
              thinkingPlayerId={thinkingPlayerId}
              region="left"
              mobile={false}
            />
          </div>
          <div className="flex sm:hidden">
            <OpponentSeats
              bots={bots}
              positions={positions}
              currentPlayerId={currentPlayer.id}
              thinkingPlayerId={thinkingPlayerId}
              region="left"
              mobile
            />
          </div>
        </div>

        <div className="relative flex min-w-0 flex-1 items-stretch justify-center">
          <div className="hidden h-full w-full items-center justify-center sm:flex">
            <TableCenter
              drawCount={state.drawPile.length}
              discardStack={state.discardPile}
              activeColor={state.activeColor}
              pendingDraw={state.pendingDraw}
              direction={state.direction}
              turnText={turnText}
              turnTone={turnTone}
              pulse={!isHumanTurn}
              mobile={false}
              canDraw={false}
            />
          </div>
          <div className="flex h-full w-full items-center justify-center sm:hidden">
            <TableCenter
              drawCount={state.drawPile.length}
              discardStack={state.discardPile}
              activeColor={state.activeColor}
              pendingDraw={state.pendingDraw}
              direction={state.direction}
              turnText={turnText}
              turnTone={turnTone}
              pulse={!isHumanTurn}
              mobile
              canDraw={showDraw && interactive}
              onDraw={onDraw}
            />
          </div>
        </div>

        <div className="flex w-[var(--side-strip-w,28px)] items-center justify-end pr-1 sm:w-[100px] sm:pr-2">
          <div className="hidden sm:flex">
            <OpponentSeats
              bots={bots}
              positions={positions}
              currentPlayerId={currentPlayer.id}
              thinkingPlayerId={thinkingPlayerId}
              region="right"
              mobile={false}
            />
          </div>
          <div className="flex sm:hidden">
            <OpponentSeats
              bots={bots}
              positions={positions}
              currentPlayerId={currentPlayer.id}
              thinkingPlayerId={thinkingPlayerId}
              region="right"
              mobile
            />
          </div>
        </div>
      </div>

      <ToastStack items={toasts} className="absolute left-1/2 top-14 z-40 -translate-x-1/2 sm:top-16" />

      <div className="relative z-30 flex min-h-[200px] w-full flex-col items-center pb-[env(safe-area-inset-bottom,4px)]">
        <PlayerControls
          players={state.players}
          catchTargets={catchTargets}
          showDraw={showDraw}
          showPass={showPass}
          canCallUno={canCallUno}
          isHumanTurn={isHumanTurn}
          onCatchUno={onCatchUno}
          onDraw={onDraw}
          onPass={onPass}
          onCallUno={onCallUno}
        />
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
