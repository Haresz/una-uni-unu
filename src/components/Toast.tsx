export type ToastTone = 'info' | 'success' | 'warn' | 'danger';

export interface ToastItem {
  id: string;
  text: string;
  tone?: ToastTone;
}

const TONES: Record<ToastTone, string> = {
  info: 'bg-slate-800/90 ring-white/15',
  success: 'bg-emerald-600/90 ring-emerald-200/40',
  warn: 'bg-amber-500/90 text-amber-950 ring-amber-200/50',
  danger: 'bg-rose-600/90 ring-rose-200/40',
};

export interface ToastStackProps {
  items: ToastItem[];
  className?: string;
}

/** Lightweight event notifications. Purely presentational for now. */
export function ToastStack({ items, className = '' }: ToastStackProps) {
  return (
    <div
      className={`pointer-events-none flex flex-col items-center gap-2 ${className}`}
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`animate-pop-in rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-lg ring-1 ${TONES[item.tone ?? 'info']}`}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
