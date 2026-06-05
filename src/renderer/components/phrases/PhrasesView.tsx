import { useMemo, useState } from 'react'
import type { Phrase } from '@shared/types'
import { SearchInput } from '../common/SearchInput'
import { GroupTabs } from './GroupTabs'
import { PhraseCard } from './PhraseCard'
import { NewGroupDialog } from './NewGroupDialog'
import { ManageGroupsDialog } from './ManageGroupsDialog'
import { NewPhraseDialog } from './NewPhraseDialog'
import { usePhrases } from '@renderer/store/usePhrases'
import { useUi } from '@renderer/store/useUi'

export function PhrasesView() {
  const phrases = usePhrases((s) => s.phrases)
  const activeGroupId = usePhrases((s) => s.activeGroupId)
  const createGroup = usePhrases((s) => s.createGroup)
  const createPhrase = usePhrases((s) => s.createPhrase)
  const updatePhrase = usePhrases((s) => s.updatePhrase)
  const deletePhrase = usePhrases((s) => s.deletePhrase)
  const exportLibrary = usePhrases((s) => s.exportLibrary)
  const importLibrary = usePhrases((s) => s.importLibrary)
  const showToast = useUi((s) => s.showToast)

  const [q, setQ] = useState('')
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [phraseOpen, setPhraseOpen] = useState(false)
  const [editing, setEditing] = useState<Phrase | null>(null)

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase()
    return phrases.filter((p) => {
      if (p.groupId !== activeGroupId) return false
      if (!query) return true
      return `${p.content} ${p.note ?? ''}`.toLowerCase().includes(query)
    })
  }, [phrases, activeGroupId, q])

  const onCopy = async (p: Phrase): Promise<void> => {
    const ok = await window.api.phrases.copy(p.id)
    showToast(ok ? '已复制到剪贴板' : '复制失败')
  }

  const onExport = async (): Promise<void> => {
    const result = await exportLibrary()
    showToast(result.ok ? `已导出 ${result.phraseCount ?? 0} 条短语` : result.message)
  }

  const onImport = async (): Promise<void> => {
    const result = await importLibrary()
    if (result.ok) {
      const skipped = result.skippedCount ? `，跳过 ${result.skippedCount} 条` : ''
      showToast(`已导入 ${result.phraseCount ?? 0} 条短语${skipped}`)
    } else {
      showToast(result.message)
    }
  }

  return (
    <div className="flex h-full flex-col px-4 pb-3">
      <SearchInput value={q} onChange={setQ} placeholder="搜索短语..." />

      <div className="mt-3">
        <GroupTabs
          onNewGroup={() => setNewGroupOpen(true)}
          onManage={() => setManageOpen(true)}
          onImport={() => void onImport()}
          onExport={() => void onExport()}
          onNewPhrase={() => {
            setEditing(null)
            setPhraseOpen(true)
          }}
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {activeGroupId == null ? (
          <div className="grid h-full place-items-center text-sm text-ink-muted">请先创建一个场景组</div>
        ) : visible.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-ink-muted">
            {q ? '未找到匹配短语' : '该分组暂无短语'}
          </div>
        ) : (
          visible.map((p) => (
            <PhraseCard
              key={p.id}
              phrase={p}
              onCopy={() => onCopy(p)}
              onEdit={() => {
                setEditing(p)
                setPhraseOpen(true)
              }}
              onDelete={() => void deletePhrase(p.id)}
            />
          ))
        )}
      </div>

      <NewGroupDialog
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        onSubmit={(name) => void createGroup(name)}
      />
      <ManageGroupsDialog open={manageOpen} onClose={() => setManageOpen(false)} />
      <NewPhraseDialog
        open={phraseOpen}
        onClose={() => setPhraseOpen(false)}
        editing={editing}
        onSubmit={(data) => {
          if (editing) void updatePhrase(editing.id, data)
          else if (activeGroupId)
            void createPhrase({ groupId: activeGroupId, content: data.content, note: data.note })
        }}
      />
    </div>
  )
}
