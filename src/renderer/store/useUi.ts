import { create } from 'zustand'

export type ModuleKey = 'clipboard' | 'phrases' | 'translate' | 'voice' | 'settings'

interface ToastItem {
  id: number
  message: string
}

interface UiState {
  activeModule: ModuleKey
  setModule: (m: ModuleKey) => void
  shortcutFailure: string | null
  setShortcutFailure: (accelerator: string) => void
  clearShortcutFailure: () => void
  toast: ToastItem | null
  showToast: (message: string) => void
  clearToast: () => void
}

let toastSeq = 0

export const useUi = create<UiState>((set) => ({
  activeModule: 'clipboard',
  setModule: (m) => set({ activeModule: m }),
  shortcutFailure: null,
  setShortcutFailure: (accelerator) => set({ shortcutFailure: accelerator }),
  clearShortcutFailure: () => set({ shortcutFailure: null }),
  toast: null,
  showToast: (message) => {
    const id = ++toastSeq
    set({ toast: { id, message } })
    setTimeout(() => {
      set((st) => (st.toast?.id === id ? { toast: null } : st))
    }, 1800)
  },
  clearToast: () => set({ toast: null })
}))
