import { useEffect, useState } from 'react'
import { Copy, Loader2, Mic, Settings as SettingsIcon, Square, X } from 'lucide-react'
import type { AsrConfig } from '@shared/types'
import { useRecorder } from '@renderer/lib/useRecorder'
import { cn } from '@renderer/lib/cn'
import { Button } from '../common/Button'
import { AsrSettingsOverlay } from './AsrSettingsOverlay'

type Status = 'idle' | 'recording' | 'transcribing'

interface Props {
  compact?: boolean
  onClose?: () => void
}

export function VoicePanel({ compact, onClose }: Props) {
  const { recording, error, start, stop } = useRecorder()
  const [status, setStatus] = useState<Status>('idle')
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [cfg, setCfg] = useState<AsrConfig | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    void window.api.asr.getConfig().then(setCfg)
  }, [])

  const polish = cfg?.polish ?? true

  const togglePolish = async (): Promise<void> => {
    const next = await window.api.asr.setConfig({ polish: !polish })
    setCfg(next)
  }

  const onMic = async (): Promise<void> => {
    if (status === 'transcribing') return
    if (!recording) {
      setMsg('')
      setText('')
      await start()
      setStatus('recording')
    } else {
      setStatus('transcribing')
      const wav = await stop()
      if (!wav) {
        setStatus('idle')
        setMsg('没有录到音频')
        return
      }
      const res = await window.api.asr.transcribe(wav, { polish })
      setStatus('idle')
      if (res.ok) setText(res.text ?? '')
      else setMsg(res.message ?? '识别失败')
    }
  }

  const copy = async (): Promise<void> => {
    if (!text.trim()) return
    try {
      const ok = await window.api.clipboard.writeText(text)
      if (!ok) {
        setMsg('复制失败')
        return
      }
    } catch (e) {
      setMsg((e as { message?: string })?.message || '复制失败')
      return
    }
    if (compact && onClose) onClose()
  }

  const statusText =
    status === 'recording'
      ? '正在录音…点击停止'
      : status === 'transcribing'
        ? 'AI 识别中…'
        : '点击麦克风开始说话'

  return (
    <div className={cn('flex h-full flex-col', compact ? 'px-3 pb-3' : 'px-4 pb-3')}>
      <div className="flex items-center gap-2 pb-2">
        <button
          type="button"
          onClick={togglePolish}
          className={cn(
            'no-drag h-7 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
            polish ? 'bg-accent text-white shadow-sm shadow-accent/20' : 'bg-surface-2 text-ink-soft'
          )}
        >
          术语润色 {polish ? '开' : '关'}
        </button>
        <span className="truncate text-xs text-ink-muted">{statusText}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {!compact && (
            <button
              type="button"
              title="语音识别设置"
              onClick={() => setSettingsOpen(true)}
              className="no-drag grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-ink-soft hover:bg-black/10 dark:hover:bg-white/10"
            >
              <SettingsIcon size={14} />
            </button>
          )}
          {compact && onClose && (
            <button
              type="button"
              title="关闭"
              onClick={onClose}
              className="no-drag grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-ink-soft hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center py-2">
        <button
          type="button"
          onClick={onMic}
          disabled={status === 'transcribing'}
          className={cn(
            'no-drag grid place-items-center rounded-full transition-all',
            compact ? 'h-16 w-16' : 'h-20 w-20',
            recording ? 'animate-pulse bg-red-500 text-white' : 'bg-accent text-white shadow-lg shadow-accent/25 hover:opacity-90',
            status === 'transcribing' && 'opacity-60'
          )}
        >
          {status === 'transcribing' ? (
            <Loader2 className="animate-spin" size={compact ? 24 : 28} />
          ) : recording ? (
            <Square size={compact ? 20 : 24} />
          ) : (
            <Mic size={compact ? 26 : 30} />
          )}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="识别结果将显示在这里,可手动编辑…"
        className="no-drag min-h-0 flex-1 resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-ink outline-none focus:border-ink/30"
      />

      {(msg || error) && <div className="pt-1.5 text-xs text-red-500">{msg || error}</div>}

      <div className="pt-2">
        <Button onClick={copy} disabled={!text.trim()} className="w-full">
          <Copy size={15} />
          {compact ? '复制并关闭' : '复制'}
        </Button>
      </div>

      {!compact && cfg && (
        <AsrSettingsOverlay
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          cfg={cfg}
          onSaved={setCfg}
        />
      )}
    </div>
  )
}
