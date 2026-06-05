import { useEffect } from 'react'
import { IconRail } from './components/layout/IconRail'
import { Header } from './components/layout/Header'
import { ClipboardView } from './components/clipboard/ClipboardView'
import { PhrasesView } from './components/phrases/PhrasesView'
import { TranslateView } from './components/translate/TranslateView'
import { VoiceView } from './components/voice/VoiceView'
import { SettingsView } from './components/settings/SettingsView'
import { Toast } from './components/common/Toast'
import { useUi, type ModuleKey } from './store/useUi'
import { useSettings } from './store/useSettings'
import { useClipboard } from './store/useClipboard'
import { usePhrases } from './store/usePhrases'
import { applyTheme } from './theme'

const TITLES: Record<ModuleKey, string> = {
  clipboard: '剪贴板',
  phrases: '快捷短语',
  translate: '翻译',
  voice: '语音转文字',
  settings: '设置'
}

export default function App() {
  const activeModule = useUi((s) => s.activeModule)
  const theme = useSettings((s) => s.settings.theme)

  useEffect(() => {
    void useSettings.getState().load()
    void useClipboard.getState().load()
    void usePhrases.getState().load()

    const offClip = window.api.clipboard.onChanged((items) => useClipboard.getState()._set(items))
    const offSettings = window.api.settings.onChanged((s) => {
      useSettings.getState()._set(s)
      // storage path may have changed -> refetch phrases too
      void usePhrases.getState().load()
    })
    const offTheme = window.api.theme.onChanged((mode) => applyTheme(mode))
    const handleShortcutFailure = (acc: string): void => {
      const ui = useUi.getState()
      ui.setShortcutFailure(acc)
      ui.setModule('settings')
      ui.showToast(`快捷键 ${acc} 注册失败，请更换组合键`)
    }
    const offShortcut = window.api.system.onShortcutFailed(handleShortcutFailure)
    void window.api.system.getShortcutFailures().then((failures) => {
      if (failures[0]) handleShortcutFailure(failures[0])
    })
    return () => {
      offClip()
      offSettings()
      offTheme()
      offShortcut()
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-window bg-surface text-ink shadow-floating">
      <IconRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={TITLES[activeModule]} />
        <main className="min-h-0 flex-1 overflow-hidden">
          {activeModule === 'clipboard' && <ClipboardView />}
          {activeModule === 'phrases' && <PhrasesView />}
          {activeModule === 'translate' && <TranslateView />}
          {activeModule === 'voice' && <VoiceView />}
          {activeModule === 'settings' && <SettingsView />}
        </main>
      </div>
      <Toast />
    </div>
  )
}
