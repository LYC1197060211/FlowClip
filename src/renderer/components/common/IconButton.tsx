import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }

export function IconButton({ className, active, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'no-drag inline-flex items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40',
        active && 'text-ink',
        className
      )}
    />
  )
}
