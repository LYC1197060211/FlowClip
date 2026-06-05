import { useEffect, useRef, useState } from 'react'
import { Dialog } from '../common/Dialog'
import { Button } from '../common/Button'
import { PHRASE_VARIABLES } from '@shared/constants'
import type { Phrase } from '@shared/types'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: { content: string; note: string }) => void
  editing?: Phrase | null
}

export function NewPhraseDialog({ open, onClose, onSubmit, editing }: Props) {
  const [content, setContent] = useState('')
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setContent(editing?.content ?? '')
      setNote(editing?.note ?? '')
    }
  }, [open, editing])

  const submit = (): void => {
    const c = content.trim()
    if (!c) return
    onSubmit({ content: c, note: note.trim() })
    onClose()
  }

  const insertVariable = (token: string): void => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? content.length
    const end = el?.selectionEnd ?? content.length
    const next = content.slice(0, start) + token + content.slice(end)
    setContent(next)
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? '编辑短语' : '新建短语'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit}>保存</Button>
        </>
      }
    >
      <label className="mb-1 block text-xs text-ink-soft">内容</label>
      <textarea
        ref={textareaRef}
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="输入短语内容..."
        className="w-full resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm text-ink outline-none focus:border-ink/30"
      />
      <div className="mt-2">
        <div className="mb-1 text-xs text-ink-soft">变量</div>
        <div className="flex flex-wrap gap-1.5">
          {PHRASE_VARIABLES.map((variable) => (
            <button
              key={variable.token}
              type="button"
              title={`${variable.token} · ${variable.description}`}
              onClick={() => insertVariable(variable.token)}
              className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent"
            >
              {variable.label}
            </button>
          ))}
        </div>
      </div>
      <label className="mb-1 mt-3 block text-xs text-ink-soft">备注</label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="选填,例如:查看上下文"
        className="h-10 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-ink/30"
      />
    </Dialog>
  )
}
