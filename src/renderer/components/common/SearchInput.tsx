import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: Props) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="no-drag h-11 w-full rounded-xl border border-line bg-surface-2 pl-4 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent/50"
      />
      <Search
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </div>
  )
}
