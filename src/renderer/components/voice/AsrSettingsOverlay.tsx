import { useEffect, useState, type ReactNode } from 'react'
import type { AsrConfig } from '@shared/types'
import { ASR_LANGS, ASR_PROVIDER_PRESETS } from '@shared/constants'
import { Dialog } from '../common/Dialog'
import { Button } from '../common/Button'
import { Dropdown } from '../common/Dropdown'
import { DiagnosticPanel } from '../common/DiagnosticPanel'
import { cn } from '@renderer/lib/cn'

interface Props {
  open: boolean
  onClose: () => void
  cfg: AsrConfig
  onSaved: (c: AsrConfig) => void
}

type AsrPresetValue = (typeof ASR_PROVIDER_PRESETS)[number]['value']

export function AsrSettingsOverlay({ open, onClose, cfg, onSaved }: Props) {
  const [draft, setDraft] = useState<AsrConfig>(cfg)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string; details?: string[] } | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(cfg)
      setTestMsg(null)
      setTesting(false)
    }
  }, [open, cfg])

  const set = (patch: Partial<AsrConfig>): void => {
    setDraft((d) => ({ ...d, ...patch }))
    setTestMsg(null)
  }

  const applyPreset = (value: AsrPresetValue): void => {
    const preset = ASR_PROVIDER_PRESETS.find((item) => item.value === value)
    if (!preset) return
    set(preset.patch)
  }

  const save = async (): Promise<void> => {
    const next = await window.api.asr.setConfig(draft)
    onSaved(next)
    onClose()
  }

  const testConfig = async (): Promise<void> => {
    if (testing) return
    setTesting(true)
    setTestMsg(null)
    const res = await window.api.asr.testConfig(draft)
    setTesting(false)
    setTestMsg({ ok: res.ok, text: res.message, details: res.details })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="语音识别设置"
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
            value={getAsrPresetValue(draft)}
            options={ASR_PROVIDER_PRESETS}
            onChange={applyPreset}
            ariaLabel="选择语音识别服务商预设"
          />
          <PresetHint value={getAsrPresetValue(draft)} />
        </Field>
        <Field label="识别 API 地址 (包含 /v1)">
          <Input
            value={draft.baseUrl}
            onChange={(v) => set({ baseUrl: v })}
            placeholder="https://api.siliconflow.cn/v1"
          />
        </Field>
        <Field label="API Key">
          <Input
            type="password"
            value={draft.apiKey}
            onChange={(v) => set({ apiKey: v })}
            placeholder="sk-..."
          />
        </Field>
        <Field label="模型">
          <Input
            value={draft.model}
            onChange={(v) => set({ model: v })}
            placeholder="FunAudioLLM/SenseVoiceSmall"
          />
        </Field>
        <Field label="语言">
          <Dropdown
            value={draft.language}
            options={ASR_LANGS}
            onChange={(v) => set({ language: v })}
            ariaLabel="选择语音识别语言"
          />
        </Field>
        <Field label="热词 / 提示词 (可选)">
          <Input
            value={draft.hotwords}
            onChange={(v) => set({ hotwords: v })}
            placeholder="用逗号分隔专业词，提升识别准确率"
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-ink">AI 术语润色</div>
            <div className="mt-0.5 text-xs text-ink-muted">
              使用 AI 断句并规范专业术语，复用翻译里的 AI Key
            </div>
          </div>
          <Switch checked={draft.polish} onChange={(v) => set({ polish: v })} />
        </div>
        <Field label="润色领域 (可选)">
          <Input value={draft.domain} onChange={(v) => set({ domain: v })} placeholder="例如: 医疗 / 法律 / IT" />
        </Field>
        <Field label="代理地址 (海外接口可填)">
          <Input
            value={draft.proxyUrl}
            onChange={(v) => set({ proxyUrl: v })}
            placeholder="http://127.0.0.1:7890"
          />
        </Field>
        {testMsg && (
          <DiagnosticPanel
            title="语音转写"
            ok={testMsg.ok}
            text={testMsg.text}
            details={testMsg.details}
          />
        )}
      </div>
    </Dialog>
  )
}

function getAsrPresetValue(cfg: AsrConfig): AsrPresetValue {
  if (
    cfg.baseUrl.replace(/\/+$/, '') === 'https://api.siliconflow.cn/v1' &&
    cfg.model === 'FunAudioLLM/SenseVoiceSmall'
  ) {
    return 'siliconflow_sensevoice'
  }
  return 'openai_compatible'
}

function PresetHint({ value }: { value: AsrPresetValue }) {
  const preset = ASR_PROVIDER_PRESETS.find((item) => item.value === value)
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

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
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
