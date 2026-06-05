import { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'
import { VoicePanel } from './components/voice/VoicePanel'
import { useSettings } from './store/useSettings'
import { applyTheme } from './theme'

export default function VoiceApp() {
  const theme = useSettings((s) => s.settings.theme)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    void useSettings.getState().load()
    const offTheme = window.api.theme.onChanged((m) => applyTheme(m))
    const offSettings = window.api.settings.onChanged((s) => useSettings.getState()._set(s))
    const offShow = window.api.voice.onShow(() => setResetKey((k) => k + 1))
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') window.api.voice.hide()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      offTheme()
      offSettings()
      offShow()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-window bg-surface text-ink shadow-floating">
      <div className="drag flex items-center gap-2 px-4 pb-1 pt-3">
        <Mic size={15} className="text-ink-soft" />
        <span className="text-sm font-semibold text-ink">语音转文字</span>
      </div>
      <div className="min-h-0 flex-1">
        <VoicePanel key={resetKey} compact onClose={() => window.api.voice.hide()} />
      </div>
    </div>
  )
}
