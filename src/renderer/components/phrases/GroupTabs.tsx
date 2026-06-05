import { Download, Plus, SquarePen, Upload } from 'lucide-react'
import { Pill } from '../common/Pill'
import { Button } from '../common/Button'
import { usePhrases } from '@renderer/store/usePhrases'

interface Props {
  onNewGroup: () => void
  onManage: () => void
  onImport: () => void
  onExport: () => void
  onNewPhrase: () => void
}

export function GroupTabs({ onNewGroup, onManage, onImport, onExport, onNewPhrase }: Props) {
  const groups = usePhrases((s) => s.groups)
  const activeGroupId = usePhrases((s) => s.activeGroupId)
  const setActiveGroup = usePhrases((s) => s.setActiveGroup)

  return (
    <div className="no-drag flex items-center gap-2 overflow-x-auto pb-1">
      {groups.map((g) => (
        <Pill key={g.id} active={activeGroupId === g.id} onClick={() => setActiveGroup(g.id)}>
          {g.name}
        </Pill>
      ))}
      <button
        type="button"
        title="新建场景组"
        onClick={onNewGroup}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        title="管理分组"
        onClick={onManage}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <SquarePen size={15} />
      </button>
      <button
        type="button"
        title="导入短语库"
        onClick={onImport}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Upload size={15} />
      </button>
      <button
        type="button"
        title="导出短语库"
        onClick={onExport}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Download size={15} />
      </button>
      <Button onClick={onNewPhrase} className="ml-1 h-8 shrink-0 rounded-full px-3.5">
        <Plus size={15} />
        新建短语
      </Button>
    </div>
  )
}
