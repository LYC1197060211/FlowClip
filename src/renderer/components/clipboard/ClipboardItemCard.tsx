import { File, Image as ImageIcon, Link2, Pin, Trash2, Type, type LucideIcon } from 'lucide-react'
import type { ClipboardItem, ClipboardType } from '@shared/types'
import { TYPE_META } from '@shared/constants'
import { formatTime } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'

const TYPE_ICON: Record<ClipboardType, LucideIcon> = {
  text: Type,
  image: ImageIcon,
  link: Link2,
  file: File
}

interface Props {
  item: ClipboardItem
  onCopy: () => void
  onTogglePin: () => void
  onDelete: () => void
}

export function ClipboardItemCard({ item, onCopy, onTogglePin, onDelete }: Props) {
  const meta = TYPE_META[item.type]
  const Icon = TYPE_ICON[item.type]

  return (
    <div
      onClick={onCopy}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border border-line bg-card py-2.5 pl-3.5 pr-3 transition-colors hover:border-ink/20',
        item.pinned && 'bg-accent-soft/20 ring-1 ring-accent/25'
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={14} style={{ color: meta.color }} />
        <span className="text-xs font-medium" style={{ color: meta.color }}>
          {meta.label}
        </span>
        {item.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
            <Pin size={10} />
            置顶
          </span>
        )}
        <button
          type="button"
          aria-label={item.pinned ? '取消置顶' : '置顶'}
          title={item.pinned ? '取消置顶' : '置顶'}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin()
          }}
          className={cn(
            'ml-auto grid h-6 w-6 place-items-center rounded-md text-ink-muted transition-opacity hover:bg-black/5 hover:text-accent dark:hover:bg-white/10',
            item.pinned ? 'text-accent opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <Pin size={14} />
        </button>
        <button
          type="button"
          aria-label="删除"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-muted opacity-0 transition-opacity hover:bg-black/5 hover:text-ink group-hover:opacity-100 dark:hover:bg-white/10"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {item.type === 'image' ? (
        item.thumbDataUrl ? (
          <img
            src={item.thumbDataUrl}
            alt="图片"
            className="max-h-20 rounded-md border border-line object-contain"
          />
        ) : (
          <span className="text-sm text-ink-muted">图片</span>
        )
      ) : item.type === 'link' ? (
        <span className="selectable block break-all text-sm text-type-text underline decoration-type-text/40">
          {item.url}
        </span>
      ) : item.type === 'file' ? (
        <span className="block break-all text-sm text-ink">
          {item.fileName}
          {item.fileCount && item.fileCount > 1 ? ` 等 ${item.fileCount} 个文件` : ''}
        </span>
      ) : (
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink">{item.text}</p>
      )}

      <div className="mt-1.5 text-xs text-ink-muted">{formatTime(item.createdAt)}</div>
    </div>
  )
}
