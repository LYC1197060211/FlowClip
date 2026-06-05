import { create } from 'zustand'
import type { ClipboardItem } from '@shared/types'

interface ClipboardState {
  items: ClipboardItem[]
  load: () => Promise<void>
  copyBack: (id: string) => Promise<boolean>
  togglePin: (id: string) => Promise<boolean>
  remove: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  /** internal: set from a main-process push */
  _set: (items: ClipboardItem[]) => void
}

export const useClipboard = create<ClipboardState>((set) => ({
  items: [],
  load: async () => set({ items: await window.api.clipboard.list() }),
  copyBack: async (id) => window.api.clipboard.copyBack(id),
  togglePin: async (id) => window.api.clipboard.togglePin(id),
  remove: async (id) => {
    await window.api.clipboard.delete(id)
  },
  clearAll: async () => {
    await window.api.clipboard.clearAll()
  },
  _set: (items) => set({ items })
}))
