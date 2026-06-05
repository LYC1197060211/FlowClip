import { VoicePanel } from './VoicePanel'
import { useSettings } from '@renderer/store/useSettings'

export function VoiceView() {
  const hotkey = useSettings((s) => s.settings.voiceHotkey)
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <VoicePanel />
      </div>
      <div className="px-4 pb-2 text-center text-[11px] text-ink-muted">
        悬浮听写快捷键 {hotkey} · 点齿轮配置识别引擎
      </div>
    </div>
  )
}
