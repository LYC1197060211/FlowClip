import type { HTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cn('rounded-xl border border-line bg-card', className)} />
}
