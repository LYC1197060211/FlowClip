import { X } from 'lucide-react'
import { IconButton } from '@renderer/components/common/IconButton'

export function Header({ title }: { title: string }) {
  return (
    <header className="drag flex h-14 shrink-0 items-center justify-between pl-5 pr-3">
      <h1 className="text-lg font-bold text-ink">{title}</h1>
      <IconButton
        className="h-8 w-8 rounded-full bg-surface-2 hover:bg-black/10 dark:hover:bg-white/15"
        onClick={() => window.api.window.close()}
        aria-label="关闭"
        title="关闭(最小化到托盘)"
      >
        <X size={16} />
      </IconButton>
    </header>
  )
}
