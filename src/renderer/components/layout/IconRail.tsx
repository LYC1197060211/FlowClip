import { Clipboard, Languages, List, Mic, Moon, Settings, Sun, type LucideIcon } from 'lucide-react'
import { APP_NAME } from '@shared/constants'
import { cn } from '@renderer/lib/cn'
import { LogoMark } from '@renderer/icons/LogoMark'
import { useUi, type ModuleKey } from '@renderer/store/useUi'
import { useSettings } from '@renderer/store/useSettings'

const NAV: { key: ModuleKey; icon: LucideIcon; label: string }[] = [
  { key: 'clipboard', icon: Clipboard, label: '剪贴板' },
  { key: 'phrases', icon: List, label: '快捷短语' },
  { key: 'translate', icon: Languages, label: '翻译' },
  { key: 'voice', icon: Mic, label: '语音转文字' }
]

export function IconRail() {
  const active = useUi((s) => s.activeModule)
  const setModule = useUi((s) => s.setModule)
  const dark = useSettings((s) => s.settings.theme === 'dark')

  return (
    <div className="drag flex w-[60px] shrink-0 flex-col items-center gap-1 border-r border-line bg-surface-2 py-3">
      <div className="mb-2 grid h-9 w-9 place-items-center" title={APP_NAME}>
        <LogoMark size={30} />
      </div>
      {NAV.map((item) => (
        <RailButton
          key={item.key}
          icon={item.icon}
          label={item.label}
          active={active === item.key}
          onClick={() => setModule(item.key)}
        />
      ))}
      <div className="mt-auto" />
      <RailButton
        icon={Settings}
        label="设置"
        active={active === 'settings'}
        onClick={() => setModule('settings')}
      />
      <RailButton
        icon={dark ? Sun : Moon}
        label={dark ? '浅色模式' : '深色模式'}
        onClick={() => window.api.theme.set(dark ? 'light' : 'dark')}
      />
    </div>
  )
}

function RailButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'no-drag grid h-10 w-10 place-items-center rounded-xl transition-colors',
        active ? 'bg-accent text-white shadow-sm shadow-accent/25' : 'text-ink-soft hover:bg-black/5 dark:hover:bg-white/10'
      )}
    >
      <Icon size={20} strokeWidth={2} />
    </button>
  )
}
