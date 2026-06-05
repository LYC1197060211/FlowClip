import { useState } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { Dialog } from '../common/Dialog'
import { usePhrases } from '@renderer/store/usePhrases'

interface Props {
  open: boolean
  onClose: () => void
}

export function ManageGroupsDialog({ open, onClose }: Props) {
  const groups = usePhrases((s) => s.groups)
  const renameGroup = usePhrases((s) => s.renameGroup)
  const deleteGroup = usePhrases((s) => s.deleteGroup)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const startEdit = (id: string, name: string): void => {
    setEditingId(id)
    setDraft(name)
  }

  const commit = (): void => {
    if (editingId) {
      const n = draft.trim()
      if (n) void renameGroup(editingId, n)
    }
    setEditingId(null)
  }

  return (
    <Dialog open={open} onClose={onClose} title="管理分组" maxWidth={360}>
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {groups.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-muted">暂无分组</p>
        )}
        {groups.map((g) => (
          <div
            key={g.id}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2"
          >
            {editingId === g.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{g.name}</span>
            )}
            {editingId === g.id ? (
              <button
                type="button"
                aria-label="确认"
                onClick={commit}
                className="grid h-7 w-7 place-items-center rounded-md text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Check size={15} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="重命名"
                onClick={() => startEdit(g.id, g.name)}
                className="grid h-7 w-7 place-items-center rounded-md text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              type="button"
              aria-label="删除"
              onClick={() => void deleteGroup(g.id)}
              className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
