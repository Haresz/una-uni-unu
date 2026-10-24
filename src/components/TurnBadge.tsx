export type TurnTone = 'you' | 'bot' | 'neutral';

export interface TurnBadgeProps {
  text: string;
  tone?: TurnTone;
  pulse?: boolean;
  className?: string;
}

const TONES: Record<TurnTone, string> = {
  you: 'bg-amber-400 text-emerald-950 ring-amber-200',
  bot: 'bg-emerald-500/90 text-white ring-emerald-200/70',
  neutral: 'bg-white/10 text-white ring-white/20 backdrop-blur',
};

export function TurnBadge({ text, tone = 'neutral', pulse = false, className = '' }: TurnBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-2 ${TONES[tone]} ${className}`}
    >
      {pulse && <span className="h-2 w-2 animate-pulse rounded-full bg-current" />}
      {text}
    </span>
  );
}
