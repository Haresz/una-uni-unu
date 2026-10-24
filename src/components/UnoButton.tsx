import type { ReactNode } from 'react';

export interface UnoButtonProps {
  onClick?: () => void;
  /** `call` is the classic "UNO!" call; `catch` is challenging an opponent. */
  variant?: 'call' | 'catch';
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export function UnoButton({
  onClick,
  variant = 'call',
  disabled = false,
  className = '',
  children,
}: UnoButtonProps) {
  const isCatch = variant === 'catch';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'select-none rounded-full px-4 py-2 text-base font-black uppercase italic tracking-wide min-h-[44px] min-w-[44px]',
        'shadow-[0_8px_0_rgba(0,0,0,0.35)] transition active:translate-y-0.5 active:shadow-[0_4px_0_rgba(0,0,0,0.35)]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        isCatch
          ? 'bg-rose-500 text-white hover:bg-rose-400'
          : 'bg-amber-400 text-emerald-950 hover:bg-amber-300',
        className,
      ].join(' ')}
    >
      {children ?? (isCatch ? 'Catch!' : 'UNO!')}
    </button>
  );
}
