import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { ClipboardType } from '@shared/types'
import { CLIPBOARD_FILTERS } from '@shared/constants'
import { SearchInput } from '../common/SearchInput'
import { Pill } from '../common/Pill'
import { Dialog } from '../common/Dialog'
import { Button } from '../common/Button'
import { ClipboardItemCard } from './ClipboardItemCard'
import { useClipboard } from '@renderer/store/useClipboard'
import { useUi } from '@renderer/store/useUi'

type Filter = ClipboardType | 'all'

export function ClipboardView() {
  const items = useClipboard((s) => s.items)
  const copyBack = useClipboard((s) => s.copyBack)
  const togglePin = useClipboard((s) => s.togglePin)
  const remove = useClipboard((s) => s.remove)
  const clearAll = useClipboard((s) => s.clearAll)
  const showToast = useUi((s) => s.showToast)

  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((it) => {
      if (filter !== 'all' && it.type !== filter) return false
      if (!query) return true
      const hay = `${it.text ?? ''} ${it.url ?? ''} ${it.fileName ?? ''}`.toLowerCase()
      return hay.includes(query)
    })
  }, [items, filter, q])

  const onCopy = async (id: string): Promise<void> => {
    const ok = await copyBack(id)
    showToast(ok ? '已复制到剪贴板' : '复制失败')
  }

  const onTogglePin = async (id: string, pinned?: boolean): Promise<void> => {
    const ok = await togglePin(id)
    if (ok) showToast(pinned ? '已取消置顶' : '已置顶')
  }

  return (
    <div className="flex h-full flex-col px-4 pb-3">
      <SearchInput value={q} onChange={setQ} placeholder="搜索剪贴板..." />

      <div className="no-drag mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {CLIPBOARD_FILTERS.map((f) => (
          <Pill key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Pill>
        ))}
        {items.length > 0 && (
          <button
            type="button"
            title="清空全部"
            onClick={() => setConfirmClear(true)}
            className="no-drag ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {filtered.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-ink-muted">
            {items.length === 0 ? '暂无剪贴板记录' : '未找到匹配的记录'}
          </div>
        ) : (
          filtered.map((it) => (
            <ClipboardItemCard
              key={it.id}
              item={it}
              onCopy={() => onCopy(it.id)}
              onTogglePin={() => onTogglePin(it.id, it.pinned)}
              onDelete={() => remove(it.id)}
            />
          ))
        )}
      </div>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="清空剪贴板历史"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                void clearAll()
                setConfirmClear(false)
                showToast('已清空')
              }}
            >
              清空全部记录
            </Button>
          </>
        }
      >
        <p className="text-center text-sm text-ink-soft">
          确定要清空全部剪贴板记录吗？此操作不可恢复，置顶记录也会被删除。
        </p>
      </Dialog>
    </div>
  )
}
