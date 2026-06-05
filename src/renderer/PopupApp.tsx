import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { File, Image as ImageIcon, Link2, Search, Type } from 'lucide-react'
import type { ClipboardItem, ClipboardType, Phrase } from '@shared/types'
import { CLIPBOARD_FILTERS, TYPE_META } from '@shared/constants'
import { cn } from './lib/cn'
import { formatTime } from './lib/format'
import { useClipboard } from './store/useClipboard'
import { usePhrases } from './store/usePhrases'
import { useSettings } from './store/useSettings'
import { applyTheme } from './theme'

type Tab = 'clipboard' | 'phrases'

const TYPE_ICON: Record<ClipboardType, typeof Type> = {
  text: Type,
  image: ImageIcon,
  link: Link2,
  file: File
}

export default function PopupApp() {
  const items = useClipboard((s) => s.items)
  const phrases = usePhrases((s) => s.phrases)
  const groups = usePhrases((s) => s.groups)
  const activeGroupId = usePhrases((s) => s.activeGroupId)
  const setActiveGroup = usePhrases((s) => s.setActiveGroup)
  const theme = useSettings((s) => s.settings.theme)
  const autoPasteOnPopup = useSettings((s) => s.settings.autoPasteOnPopup)

  const [tab, setTab] = useState<Tab>('clipboard')
  const [filter, setFilter] = useState<ClipboardType | 'all'>('all')
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const selRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void useSettings.getState().load()
    void useClipboard.getState().load()
    void usePhrases.getState().load()

    const offClip = window.api.clipboard.onChanged((it) => useClipboard.getState()._set(it))
    const offTheme = window.api.theme.onChanged((m) => applyTheme(m))
    const offSettings = window.api.settings.onChanged((s) => useSettings.getState()._set(s))
    const offShow = window.api.popup.onShow(() => {
      void useClipboard.getState().load()
      void usePhrases.getState().load()
      setTab('clipboard')
      setFilter('all')
      setQuery('')
      setSel(0)
      window.setTimeout(() => searchRef.current?.focus(), 30)
    })
    return () => {
      offClip()
      offTheme()
      offSettings()
      offShow()
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const clipList = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (filter !== 'all' && i.type !== filter) return false
      if (!q) return true
      const hay = `${i.text ?? ''} ${i.url ?? ''} ${i.fileName ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, filter, query])
  const phraseList = useMemo(() => {
    const q = query.trim().toLowerCase()
    return phrases.filter((p) => {
      if (p.groupId !== activeGroupId) return false
      if (!q) return true
      return `${p.content} ${p.note ?? ''}`.toLowerCase().includes(q)
    })
  }, [phrases, activeGroupId, query])
  const list: (ClipboardItem | Phrase)[] = tab === 'clipboard' ? clipList : phraseList

  useEffect(() => {
    setSel((s) => Math.min(Math.max(0, s), Math.max(0, list.length - 1)))
  }, [list.length])

  useEffect(() => {
    selRef.current?.scrollIntoView({ block: 'nearest' })
  }, [sel, tab])

  const activate = async (idx: number): Promise<void> => {
    const it = list[idx]
    if (!it) return
    const ok =
      tab === 'clipboard'
        ? await window.api.clipboard.copyBack(it.id)
        : await window.api.phrases.copy(it.id)
    if (!ok) return
    window.api.popup.hide()
    if (autoPasteOnPopup) void window.api.system.pasteClipboard()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        window.api.popup.hide()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSel((s) => Math.min(s + 1, list.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSel((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        void activate(sel)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setTab((t) => (t === 'clipboard' ? 'phrases' : 'clipboard'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-window bg-surface text-ink shadow-floating">
      {/* tabs */}
      <div className="drag flex gap-1 p-2">
        <DwellButton
          onActivate={() => setTab('clipboard')}
          className={tabClass(tab === 'clipboard')}
        >
          剪贴板
        </DwellButton>
        <DwellButton
          onActivate={() => setTab('phrases')}
          className={tabClass(tab === 'phrases')}
        >
          快捷短语
        </DwellButton>
      </div>

      {/* category row */}
      <div className="no-drag flex items-center gap-1.5 overflow-x-auto px-2 pb-2">
        {tab === 'clipboard'
          ? CLIPBOARD_FILTERS.map((f) => (
              <DwellChip
                key={f.key}
                active={filter === f.key}
                onActivate={() => {
                  setFilter(f.key)
                  setQuery('')
                  setSel(0)
                }}
              >
                {f.label}
              </DwellChip>
            ))
          : groups.map((g) => (
              <DwellChip
                key={g.id}
                active={activeGroupId === g.id}
                onActivate={() => {
                  setActiveGroup(g.id)
                  setQuery('')
                  setSel(0)
                }}
              >
                {g.name}
              </DwellChip>
            ))}
      </div>

      <div className="no-drag px-2 pb-2">
        <div className="relative">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSel(0)
            }}
            placeholder={tab === 'clipboard' ? '搜索剪贴板...' : '搜索快捷短语...'}
            className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-3 pr-9 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent/50"
          />
          <Search
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        </div>
      </div>

      {/* list */}
      <div className="no-drag min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 pb-2">
        {list.length === 0 ? (
          <div className="grid h-full place-items-center text-xs text-ink-muted">暂无内容</div>
        ) : tab === 'clipboard' ? (
          (list as ClipboardItem[]).map((it, i) => (
            <ClipRow
              key={it.id}
              item={it}
              selected={i === sel}
              rowRef={i === sel ? selRef : undefined}
              onMouseEnter={() => setSel(i)}
              onClick={() => activate(i)}
            />
          ))
        ) : (
          (list as Phrase[]).map((p, i) => (
            <PhraseRow
              key={p.id}
              phrase={p}
              selected={i === sel}
              rowRef={i === sel ? selRef : undefined}
              onMouseEnter={() => setSel(i)}
              onClick={() => activate(i)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function tabClass(active: boolean): string {
  return cn(
    'no-drag flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors',
    active ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:text-ink-soft'
  )
}

/** Click to activate, or hover for 1s to auto-activate (prototype behavior). */
function DwellButton({
  onActivate,
  className,
  children
}: {
  onActivate: () => void
  className?: string
  children: ReactNode
}) {
  const timer = useRef<number | undefined>(undefined)
  return (
    <button
      type="button"
      className={className}
      onClick={onActivate}
      onMouseEnter={() => {
        timer.current = window.setTimeout(onActivate, 1000)
      }}
      onMouseLeave={() => {
        if (timer.current) window.clearTimeout(timer.current)
      }}
    >
      {children}
    </button>
  )
}

function DwellChip({
  active,
  onActivate,
  children
}: {
  active: boolean
  onActivate: () => void
  children: ReactNode
}) {
  const timer = useRef<number | undefined>(undefined)
  return (
    <button
      type="button"
      onClick={onActivate}
      onMouseEnter={() => {
        timer.current = window.setTimeout(onActivate, 1000)
      }}
      onMouseLeave={() => {
        if (timer.current) window.clearTimeout(timer.current)
      }}
      className={cn(
        'h-7 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
        active ? 'bg-accent text-white shadow-sm shadow-accent/20' : 'bg-surface-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10'
      )}
    >
      {children}
    </button>
  )
}

function ClipRow({
  item,
  selected,
  rowRef,
  onMouseEnter,
  onClick
}: {
  item: ClipboardItem
  selected: boolean
  rowRef?: Ref<HTMLButtonElement>
  onMouseEnter: () => void
  onClick: () => void
}) {
  const meta = TYPE_META[item.type]
  const Icon = TYPE_ICON[item.type]
  return (
    <button
      ref={rowRef}
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors',
        selected ? 'bg-accent-soft/60 text-ink dark:bg-accent-soft/40' : 'hover:bg-black/5 dark:hover:bg-white/5'
      )}
    >
      {item.type === 'image' && item.thumbDataUrl ? (
        <img src={item.thumbDataUrl} alt="" className="h-9 w-9 rounded object-cover" />
      ) : (
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded"
          style={{ backgroundColor: meta.color + '1A', color: meta.color }}
        >
          <Icon size={16} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-ink">
          {item.type === 'text'
            ? item.text
            : item.type === 'link'
              ? item.url
              : item.type === 'file'
                ? item.fileName
                : '图片'}
        </span>
        <span className="mt-0.5 block text-[11px] text-ink-muted">{formatTime(item.createdAt)}</span>
      </span>
    </button>
  )
}

function PhraseRow({
  phrase,
  selected,
  rowRef,
  onMouseEnter,
  onClick
}: {
  phrase: Phrase
  selected: boolean
  rowRef?: Ref<HTMLButtonElement>
  onMouseEnter: () => void
  onClick: () => void
}) {
  return (
    <button
      ref={rowRef}
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'block w-full rounded-lg border border-transparent px-3 py-2 text-left transition-colors',
        selected ? 'bg-accent-soft/60 text-ink dark:bg-accent-soft/40' : 'hover:bg-black/5 dark:hover:bg-white/5'
      )}
    >
      <span className="block truncate text-[13px] font-medium text-ink">{phrase.content}</span>
      {phrase.note && (
        <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{phrase.note}</span>
      )}
    </button>
  )
}
