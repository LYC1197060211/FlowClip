import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@renderer/lib/cn'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: readonly Option<T>[]
  onChange: (v: T) => void
  className?: string
  ariaLabel?: string
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={cn('relative no-drag', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-line bg-surface-2 px-4 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-ink-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-floating"
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-soft outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5 dark:hover:bg-white/10 dark:focus-visible:bg-white/10',
                o.value === value && 'text-ink'
              )}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check size={15} className="shrink-0 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
