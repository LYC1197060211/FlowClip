import { Pencil, Trash2 } from 'lucide-react'
import type { Phrase } from '@shared/types'

interface Props {
  phrase: Phrase
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
}

export function PhraseCard({ phrase, onCopy, onEdit, onDelete }: Props) {
  return (
    <div
      onClick={onCopy}
      className="group relative cursor-pointer rounded-xl border border-line bg-card py-3 pl-4 pr-3 transition-colors hover:border-ink/20"
    >
      <div className="flex items-start gap-2 border-l-2 border-line pl-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-ink">{phrase.content}</div>
          {phrase.note && <div className="mt-1 truncate text-sm text-ink-muted">{phrase.note}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="编辑"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            aria-label="删除"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
