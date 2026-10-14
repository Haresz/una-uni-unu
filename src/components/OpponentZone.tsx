import { CardView } from './cards/Card';
import { TurnBadge } from './TurnBadge';

export type SeatPosition = 'top' | 'left' | 'right';

export interface OpponentZoneProps {
  name: string;
  count: number;
  position: SeatPosition;
  isTurn: boolean;
  thinking?: boolean;
}

const MAX_VISIBLE = 6;

export function OpponentZone({ name, count, position, isTurn, thinking }: OpponentZoneProps) {
  const visible = Math.min(count, MAX_VISIBLE);
  const overflow = count - visible;

  const layout =
    position === 'top' ? 'flex-row' : 'flex-col';

  return (
    <div className="flex flex-col items-center gap-2" data-seat={position}>
      <div
        className={`flex ${layout} items-center justify-center rounded-2xl p-2 transition-shadow ${
          isTurn ? 'bg-white/5 shadow-[0_0_0_2px_rgba(253,224,71,0.8),0_0_28px_rgba(253,224,71,0.35)]' : ''
        }`}
      >
        {Array.from({ length: visible }).map((_, index) => (
          <div
            key={index}
            className={
              position === 'top'
                ? index > 0
                  ? '-ml-6'
                  : ''
                : index > 0
                  ? '-mt-9'
                  : ''
            }
          >
            <CardView faceDown size="sm" />
          </div>
        ))}
        {overflow > 0 && (
          <span className="ml-2 text-sm font-bold text-white/80">+{overflow}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white/90">{name}</span>
        <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white/90 ring-1 ring-white/15">
          {count} cards
        </span>
      </div>
      {isTurn && <TurnBadge text={thinking ? 'Thinking…' : 'Turn'} tone="bot" pulse />}
    </div>
  );
}
