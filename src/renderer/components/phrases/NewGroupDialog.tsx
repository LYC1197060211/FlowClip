import { useEffect, useState } from 'react'
import { Dialog } from '../common/Dialog'
import { Button } from '../common/Button'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export function NewGroupDialog({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  const submit = (): void => {
    const n = name.trim()
    if (!n) return
    onSubmit(n)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="新建场景组"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit}>保存</Button>
        </>
      }
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="场景组名称"
        className="h-11 w-full rounded-xl border border-line bg-surface-2 px-4 text-sm text-ink outline-none focus:border-ink/30"
      />
    </Dialog>
  )
}
