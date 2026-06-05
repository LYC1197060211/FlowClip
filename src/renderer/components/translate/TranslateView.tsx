import { useEffect, useState } from 'react'
import { Copy, Languages, Settings as SettingsIcon } from 'lucide-react'
import type { TranslationConfig } from '@shared/types'
import { DEFAULT_TRANSLATION_CONFIG, TARGET_LANGS } from '@shared/constants'
import { Button } from '../common/Button'
import { Dropdown } from '../common/Dropdown'
import { IconButton } from '../common/IconButton'
import { TranslateSettingsOverlay } from './TranslateSettingsOverlay'
import { useUi } from '@renderer/store/useUi'

export function TranslateView() {
  const showToast = useUi((s) => s.showToast)
  const [cfg, setCfg] = useState<TranslationConfig>(DEFAULT_TRANSLATION_CONFIG)
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    void window.api.translate.getConfig().then(setCfg)
  }, [])

  const setTarget = async (lang: string): Promise<void> => {
    const next = await window.api.translate.setConfig({ targetLang: lang })
    setCfg(next)
  }

  const translate = async (): Promise<void> => {
    if (!text.trim() || loading) return
    setLoading(true)
    setError('')
    setResult('')
    const res = await window.api.translate.run({
      text,
      targetLang: cfg.targetLang,
      engine: cfg.defaultEngine
    })
    setLoading(false)
    if (res.ok) setResult(res.text ?? '')
    else setError(res.message ?? '翻译失败')
  }

  const copyResult = async (): Promise<void> => {
    if (!result) return
    try {
      const ok = await window.api.clipboard.writeText(result)
      showToast(ok ? '已复制结果' : '复制失败')
    } catch {
      showToast('复制失败')
    }
  }

  return (
    <div className="flex h-full flex-col px-4 pb-3">
      {/* source */}
      <div className="rounded-2xl border border-line bg-card p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="输入要翻译的文本..."
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-ink outline-none placeholder:text-ink-muted"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-ink-muted">{text.length}</span>
          <Button onClick={translate} disabled={loading || !text.trim()}>
            <Languages size={15} />
            {loading ? '翻译中' : '翻译'}
          </Button>
        </div>
      </div>

      {/* target language + settings */}
      <div className="mt-3 flex items-center gap-2.5">
        <span className="shrink-0 text-sm text-ink-soft">目标语言</span>
        <Dropdown
          value={cfg.targetLang}
          options={TARGET_LANGS.map((l) => ({ value: l as string, label: l }))}
          onChange={setTarget}
          className="flex-1"
        />
        <IconButton
          onClick={() => setSettingsOpen(true)}
          title="翻译设置"
          className="h-11 w-11 shrink-0 rounded-xl bg-surface-2"
        >
          <SettingsIcon size={18} />
        </IconButton>
      </div>

      {/* result */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm text-ink-soft">结果</span>
          <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-blue-500">
            {cfg.defaultEngine === 'ai' ? 'AI' : 'Google'}
          </span>
          <IconButton
            onClick={copyResult}
            disabled={!result}
            title="复制结果"
            className="ml-auto h-7 w-7 rounded-md"
          >
            <Copy size={14} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <span className="text-sm text-ink-muted">翻译中...</span>
          ) : error ? (
            <span className="text-sm text-red-500">{error}</span>
          ) : result ? (
            <p className="selectable whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
              {result}
            </p>
          ) : (
            <span className="text-sm text-ink-muted">翻译结果将显示在这里</span>
          )}
        </div>
      </div>

      <TranslateSettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        cfg={cfg}
        onSaved={setCfg}
      />
    </div>
  )
}
