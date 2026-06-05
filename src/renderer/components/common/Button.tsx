import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

type Variant = 'primary' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function Button({ variant = 'primary', className, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'no-drag inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-white shadow-sm shadow-accent/20 hover:opacity-90',
        variant === 'ghost' &&
          'bg-surface-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10',
        variant === 'danger' && 'bg-red-500 text-white shadow-sm shadow-red-500/20 hover:bg-red-600',
        className
      )}
    />
  )
}
