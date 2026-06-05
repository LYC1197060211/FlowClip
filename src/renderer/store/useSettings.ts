import { create } from 'zustand'
import type { Settings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/constants'

interface SettingsState {
  settings: Settings
  loaded: boolean
  load: () => Promise<void>
  update: (patch: Partial<Settings>) => Promise<void>
  /** internal: set from a main-process push */
  _set: (s: Settings) => void
}

export const useSettings = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    const s = await window.api.settings.get()
    set({ settings: s, loaded: true })
  },
  update: async (patch) => {
    const s = await window.api.settings.set(patch)
    set({ settings: s })
  },
  _set: (s) => set({ settings: s })
}))
