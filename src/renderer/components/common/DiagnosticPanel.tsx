import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@renderer/lib/cn'
import { Button } from './Button'

interface DiagnosticPanelProps {
  title: string
  ok: boolean
  text: string
  details?: string[]
}

type CopyState = 'idle' | 'copied' | 'failed'

export function DiagnosticPanel({ title, ok, text, details = [] }: DiagnosticPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const report = useMemo(
    () => buildDiagnosticReport({ title, ok, text, details }),
    [title, ok, text, details]
  )

  useEffect(() => {
    setCopyState('idle')
  }, [report])

  const copyReport = async (): Promise<void> => {
    const copied = await window.api.clipboard.writeText(report)
    setCopyState(copied ? 'copied' : 'failed')
  }

  return (
    <div
      role={ok ? 'status' : 'alert'}
      aria-live="polite"
      className={cn(
        'rounded-xl border px-3 py-2 text-xs',
        ok
          ? 'border-accent/25 bg-accent-soft/60 text-ink'
          : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 font-medium">{text}</div>
        <Button
          variant="ghost"
          className="h-7 shrink-0 px-2 text-xs"
          onClick={copyReport}
          aria-label={`复制${title}诊断报告`}
        >
          {copyState === 'copied' ? <Check size={13} /> : <Copy size={13} />}
          {copyState === 'copied' ? '已复制' : '复制诊断'}
        </Button>
      </div>
      {details.length > 0 && (
        <ul
          className={cn(
            'mt-1.5 space-y-1 pl-4 text-[11px] leading-relaxed',
            ok ? 'text-ink-muted' : 'text-red-600/80 dark:text-red-200/80'
          )}
        >
          {details.map((detail) => (
            <li key={detail} className="list-disc break-words">
              {detail}
            </li>
          ))}
        </ul>
      )}
      {copyState === 'failed' && (
        <div className="mt-1.5 text-[11px] font-medium">复制失败，请手动选择诊断内容。</div>
      )}
    </div>
  )
}

function buildDiagnosticReport({
  title,
  ok,
  text,
  details
}: {
  title: string
  ok: boolean
  text: string
  details: string[]
}): string {
  const lines = [
    `FlowClip ${title}诊断报告`,
    `结果: ${ok ? '通过' : '失败'}`,
    `结论: ${redactDiagnosticText(text)}`,
    ...details.map((detail) => `- ${redactDiagnosticText(detail)}`)
  ]
  return lines.join('\n')
}

function redactDiagnosticText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer <redacted>')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, 'sk-<redacted>')
    .replace(/([?&](?:api[_-]?key|token|access[_-]?token|refresh[_-]?token)=)[^&#\s]+/gi, '$1<redacted>')
}
