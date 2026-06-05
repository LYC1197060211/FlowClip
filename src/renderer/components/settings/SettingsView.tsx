import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, BookOpen, ClipboardList, ExternalLink, FileText, FolderOpen, RotateCcw } from 'lucide-react'
import { APP_NAME } from '@shared/constants'
import type { RetentionDays } from '@shared/types'
import { cn } from '@renderer/lib/cn'
import { Dropdown } from '../common/Dropdown'
import { useSettings } from '@renderer/store/useSettings'
import { useUi } from '@renderer/store/useUi'

const RETENTION_OPTS = [
  { value: '1', label: '1 天' },
  { value: '3', label: '3 天' },
  { value: '7', label: '7 天' },
  { value: '30', label: '30 天' },
  { value: 'forever', label: '永久' }
]

export function SettingsView() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const showToast = useUi((s) => s.showToast)
  const shortcutFailure = useUi((s) => s.shortcutFailure)
  const clearShortcutFailure = useUi((s) => s.clearShortcutFailure)

  const retentionValue =
    settings.retentionDays === 'forever' ? 'forever' : String(settings.retentionDays)

  const pickFolder = async (): Promise<void> => {
    const path = await window.api.system.pickStoragePath()
    if (path) {
      await update({ storagePath: path })
      showToast('已更新存储位置')
    }
  }

  const openStorageFolder = async (): Promise<void> => {
    const ok = await window.api.system.openStoragePath()
    showToast(ok ? '已打开数据目录' : '无法打开数据目录')
  }

  const openUserGuide = async (): Promise<void> => {
    const ok = await window.api.system.openUserGuide()
    showToast(ok ? '已打开用户手册' : '无法打开用户手册')
  }

  const openReleaseNotes = async (): Promise<void> => {
    const ok = await window.api.system.openReleaseNotes()
    showToast(ok ? '已打开发布说明' : '无法打开发布说明')
  }

  const copySupportDiagnostics = async (): Promise<void> => {
    const text = await window.api.system.getSupportDiagnostics()
    const ok = await window.api.clipboard.writeText(text)
    showToast(ok ? '已复制诊断信息' : '无法复制诊断信息')
  }

  return (
    <div className="h-full overflow-y-auto px-5 pb-4">
      <Section title="通用">
        {shortcutFailure && (
          <div className="my-2 flex gap-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-ink-soft">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <div className="font-medium text-ink">快捷键注册失败</div>
              <div className="mt-0.5">
                {shortcutFailure} 可能已被其他软件或输入法占用，请在下方重新录入一个组合键。
              </div>
            </div>
          </div>
        )}
        <Row label="深色模式">
          <Switch
            checked={settings.theme === 'dark'}
            onChange={(v) => window.api.theme.set(v ? 'dark' : 'light')}
          />
        </Row>
        <Row label="窗口置顶" desc="始终显示在其他窗口之上">
          <Switch
            checked={settings.alwaysOnTop}
            onChange={(v) => void update({ alwaysOnTop: v })}
          />
        </Row>
        <Row label="开机自启" desc="登录后自动在后台启动">
          <Switch
            checked={settings.launchOnStartup}
            onChange={(v) => void update({ launchOnStartup: v })}
          />
        </Row>
        <Row label="呼出快捷面板" desc="全局快捷键，呼出剪贴板和短语面板">
          <HotkeyRecorder
            value={settings.popupHotkey}
            onChange={(accel) => {
              clearShortcutFailure()
              void update({ popupHotkey: accel })
            }}
          />
        </Row>
        <Row label="语音转写快捷键" desc="全局快捷键，呼出语音转写浮窗">
          <HotkeyRecorder
            value={settings.voiceHotkey}
            onChange={(accel) => {
              clearShortcutFailure()
              void update({ voiceHotkey: accel })
            }}
          />
        </Row>
        <Row label="快捷面板自动粘贴" desc="选中内容后，自动粘贴到当前活动窗口">
          <Switch
            checked={settings.autoPasteOnPopup}
            onChange={(v) => void update({ autoPasteOnPopup: v })}
          />
        </Row>
      </Section>

      <Section title="剪贴板">
        <Row label="保留时间" desc="超过时长的记录将自动清理">
          <Dropdown
            className="w-28"
            value={retentionValue}
            options={RETENTION_OPTS}
            onChange={(v) =>
              void update({ retentionDays: (v === 'forever' ? 'forever' : Number(v)) as RetentionDays })
            }
          />
        </Row>
        <Row label="最大记录数">
          <input
            type="number"
            min={10}
            max={2000}
            value={settings.maxHistory}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n) && n > 0) void update({ maxHistory: n })
            }}
            className="h-9 w-24 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-accent/50"
          />
        </Row>
        <Row label="敏感内容保护" desc="疑似密码、Token、API Key 不保存到历史">
          <Switch
            checked={settings.sensitiveFilterEnabled}
            onChange={(v) => void update({ sensitiveFilterEnabled: v })}
          />
        </Row>
        <div className="py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm text-ink">存储位置</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openStorageFolder}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-xs text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <ExternalLink size={14} />
                打开
              </button>
              <button
                type="button"
                onClick={pickFolder}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-xs text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <FolderOpen size={14} />
                选择
              </button>
              {settings.storagePath && (
                <button
                  type="button"
                  title="恢复默认位置"
                  onClick={() => void update({ storagePath: null })}
                  className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-ink-soft transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="break-all rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-muted">
            {settings.storagePath ?? '默认位置（应用数据目录）'}
          </div>
        </div>
      </Section>

      <Section title="帮助与文档">
        <Row label="用户手册" desc="打开随安装包附带的 PDF 使用说明">
          <button
            type="button"
            aria-label="打开用户手册"
            onClick={openUserGuide}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-xs text-ink-soft outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:bg-white/10"
          >
            <BookOpen size={14} />
            打开
          </button>
        </Row>
        <Row label="发布说明" desc="查看版本更新、已知限制和安装包校验信息">
          <button
            type="button"
            aria-label="打开发布说明"
            onClick={openReleaseNotes}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-xs text-ink-soft outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:bg-white/10"
          >
            <FileText size={14} />
            打开
          </button>
        </Row>
        <Row label="应用诊断信息" desc="复制版本、系统、数据目录和配置摘要，不包含 API Key">
          <button
            type="button"
            aria-label="复制应用诊断信息"
            onClick={copySupportDiagnostics}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-xs text-ink-soft outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:bg-white/10"
          >
            <ClipboardList size={14} />
            复制
          </button>
        </Row>
      </Section>

      <div className="pt-2 text-center text-[11px] text-ink-muted">{APP_NAME} · v1.0.0</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-line py-2 last:border-b-0">
      <div className="pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="text-sm text-ink">{label}</div>
        {desc && <div className="mt-0.5 text-xs text-ink-muted">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-line'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[22px]' : 'left-0.5'
        )}
      />
    </button>
  )
}

function HotkeyRecorder({
  value,
  onChange
}: {
  value: string
  onChange: (accel: string) => void
}) {
  const [recording, setRecording] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!recording) return
    const handler = (e: KeyboardEvent): void => {
      e.preventDefault()
      e.stopPropagation()
      const accel = eventToAccelerator(e)
      if (accel) {
        onChange(accel)
        setRecording(false)
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [recording, onChange])

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setRecording((r) => !r)}
      onBlur={() => setRecording(false)}
      className={cn(
        'h-9 min-w-[120px] rounded-lg border px-3 text-sm transition-colors',
        recording
          ? 'border-accent/40 bg-surface-2 text-ink-muted'
          : 'border-line bg-surface-2 text-ink hover:border-accent/50'
      )}
    >
      {recording ? '按下快捷键...' : value}
    </button>
  )
}

function eventToAccelerator(e: KeyboardEvent): string | null {
  const mods: string[] = []
  if (e.ctrlKey) mods.push('Control')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Super')

  let key = e.key
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return null
  if (key === ' ') key = 'Space'
  else if (key.length === 1) key = key.toUpperCase()
  else {
    const map: Record<string, string> = {
      ArrowUp: 'Up',
      ArrowDown: 'Down',
      ArrowLeft: 'Left',
      ArrowRight: 'Right',
      Escape: 'Esc'
    }
    key = map[key] ?? key
  }

  const isFunctionKey = /^F\d{1,2}$/.test(key)
  if (mods.length === 0 && !isFunctionKey) return null
  return [...mods, key].join('+')
}
