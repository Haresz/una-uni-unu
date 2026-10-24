import { CardView } from './cards/Card';
import { TurnBadge } from './TurnBadge';

export type SeatPosition = 'top' | 'left' | 'right';

export interface OpponentZoneProps {
  name: string;
  count: number;
  position: SeatPosition;
  isTurn: boolean;
  thinking?: boolean;
  mobile?: boolean;
}

const MAX_VISIBLE_DESKTOP = 6;
const MAX_VISIBLE_MOBILE = 8;

export function OpponentZone({ name, count, position, isTurn, thinking, mobile = false }: OpponentZoneProps) {
  const maxVisible = mobile ? MAX_VISIBLE_MOBILE : MAX_VISIBLE_DESKTOP;
  const visible = Math.min(count, maxVisible);
  const overflow = count - visible;

  const layout = position === 'top' ? 'flex-row' : 'flex-col';

  if (mobile) {
    const isVertical = position === 'left' || position === 'right';
    return (
      <div className="flex w-full flex-col items-center justify-center gap-1" data-seat={position}>
        <div
          className={`flex ${
            isVertical ? 'flex-col' : 'flex-row'
          } items-center justify-center rounded-xl p-1 transition-shadow ${
            isTurn ? 'bg-white/5 shadow-[0_0_0_1px_rgba(253,224,71,0.8),0_0_16px_rgba(253,224,71,0.35)]' : ''
          }`}
          style={{ maxWidth: isVertical ? 'var(--side-strip-w,28px)' : '100%' }}
        >
          {Array.from({ length: visible }).map((_, index) => (
            <div
              key={index}
              className={
                position === 'top'
                  ? index > 0
                    ? '-ml-4'
                    : ''
                  : index > 0
                    ? '-mt-6'
                    : ''
              }
            >
              <CardView faceDown size="xs" />
            </div>
          ))}
          {overflow > 0 && (
            <span className="mt-0.5 text-[9px] font-bold text-white/80">+{overflow}</span>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-0.5">
          {isVertical ? (
            <span
              className="max-h-[70px] overflow-hidden text-center text-[9px] font-semibold leading-tight text-white/90"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                maxWidth: '12px',
              }}
              title={`${name} · ${count}`}
            >
              {name.length > 8 ? name.slice(0, 7) + '…' : name} · {count}
            </span>
          ) : (
            <span className="text-[9px] font-semibold text-white/90">{name.slice(0, 8)} · {count}</span>
          )}
        </div>
        {isTurn && <TurnBadge text={thinking ? '…' : 'Turn'} tone="bot" pulse className="scale-75" />}
      </div>
    );
  }

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
