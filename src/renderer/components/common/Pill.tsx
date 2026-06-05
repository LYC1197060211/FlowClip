import type { ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

interface Props {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function Pill({ active, onClick, children, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'no-drag inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
        active
          ? 'bg-accent text-white shadow-sm shadow-accent/20'
          : 'bg-surface-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10',
        className
      )}
    >
      {children}
    </button>
  )
}
