import { useEffect, useState, type ReactNode } from 'react'
import type { TranslationConfig, TranslationEngine } from '@shared/types'
import { TRANSLATION_PROVIDER_PRESETS } from '@shared/constants'
import { Dialog } from '../common/Dialog'
import { Button } from '../common/Button'
import { Dropdown } from '../common/Dropdown'
import { DiagnosticPanel } from '../common/DiagnosticPanel'

interface Props {
  open: boolean
  onClose: () => void
  cfg: TranslationConfig
  onSaved: (c: TranslationConfig) => void
}

const ENGINE_OPTS: { value: TranslationEngine; label: string }[] = [
  { value: 'google', label: 'Google 翻译' },
  { value: 'ai', label: 'AI 翻译' }
]

type TranslationPresetValue = (typeof TRANSLATION_PROVIDER_PRESETS)[number]['value']

export function TranslateSettingsOverlay({ open, onClose, cfg, onSaved }: Props) {
  const [draft, setDraft] = useState<TranslationConfig>(cfg)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string; details?: string[] } | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(cfg)
      setTestMsg(null)
      setTesting(false)
    }
  }, [open, cfg])

  const set = (patch: Partial<TranslationConfig>): void => {
    setDraft((d) => ({ ...d, ...patch }))
    setTestMsg(null)
  }

  const applyPreset = (value: TranslationPresetValue): void => {
    const preset = TRANSLATION_PROVIDER_PRESETS.find((item) => item.value === value)
    if (!preset) return
    set(preset.patch)
  }

  const save = async (): Promise<void> => {
    const next = await window.api.translate.setConfig(draft)
    onSaved(next)
    onClose()
  }

  const testConfig = async (): Promise<void> => {
    if (testing) return
    setTesting(true)
    setTestMsg(null)
    const res = await window.api.translate.testConfig(draft)
    setTesting(false)
    setTestMsg({ ok: res.ok, text: res.message, details: res.details })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="翻译设置"
      maxWidth={360}
      footer={
        <>
          <Button variant="ghost" onClick={testConfig} disabled={testing}>
            {testing ? '测试中...' : '测试连接'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save}>保存</Button>
        </>
      }
    >
      <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
        <Field label="服务商预设">
          <Dropdown
            value={getTranslationPresetValue(draft)}
            options={TRANSLATION_PROVIDER_PRESETS}
            onChange={applyPreset}
            ariaLabel="选择翻译服务商预设"
          />
          <PresetHint value={getTranslationPresetValue(draft)} />
        </Field>
        <Field label="默认翻译引擎">
          <Dropdown
            value={draft.defaultEngine}
            options={ENGINE_OPTS}
            onChange={(v) => set({ defaultEngine: v })}
            ariaLabel="选择默认翻译引擎"
          />
        </Field>
        <Field label="Google API Key (可选)">
          <Input
            value={draft.googleApiKey}
            onChange={(v) => set({ googleApiKey: v })}
            placeholder="留空使用免费接口，稳定性取决于网络环境"
          />
        </Field>
        <Field label="翻译代理地址">
          <Input
            value={draft.proxyUrl}
            onChange={(v) => set({ proxyUrl: v })}
            placeholder="http://127.0.0.1:7890"
          />
        </Field>
        <Field label="AI API 地址">
          <Input
            value={draft.apiBaseUrl}
            onChange={(v) => set({ apiBaseUrl: v })}
            placeholder="https://api.deepseek.com"
          />
        </Field>
        <Field label="AI API Key">
          <Input
            type="password"
            value={draft.apiKey}
            onChange={(v) => set({ apiKey: v })}
            placeholder="sk-..."
          />
        </Field>
        <Field label="AI 模型名称">
          <Input
            value={draft.model}
            onChange={(v) => set({ model: v })}
            placeholder="deepseek-v4-flash"
          />
        </Field>
        {testMsg && (
          <DiagnosticPanel
            title="翻译"
            ok={testMsg.ok}
            text={testMsg.text}
            details={testMsg.details}
          />
        )}
      </div>
    </Dialog>
  )
}

function getTranslationPresetValue(cfg: TranslationConfig): TranslationPresetValue {
  if (cfg.defaultEngine === 'google') return 'google_free'
  if (cfg.apiBaseUrl.replace(/\/+$/, '') === 'https://api.deepseek.com' && cfg.model === 'deepseek-v4-flash') {
    return 'deepseek'
  }
  return 'custom_ai'
}

function PresetHint({ value }: { value: TranslationPresetValue }) {
  const preset = TRANSLATION_PROVIDER_PRESETS.find((item) => item.value === value)
  if (!preset) return null
  return <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{preset.description}</p>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-soft">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-accent/50"
    />
  )
}
