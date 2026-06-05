import { create } from 'zustand'
import type {
  CreatePhraseInput,
  Phrase,
  PhraseGroup,
  PhraseLibraryResult,
  UpdatePhrasePatch
} from '@shared/types'

interface PhrasesState {
  groups: PhraseGroup[]
  phrases: Phrase[]
  activeGroupId: string | null
  loaded: boolean
  load: () => Promise<void>
  setActiveGroup: (id: string) => void
  createGroup: (name: string) => Promise<void>
  renameGroup: (id: string, name: string) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  createPhrase: (input: CreatePhraseInput) => Promise<void>
  updatePhrase: (id: string, patch: UpdatePhrasePatch) => Promise<void>
  deletePhrase: (id: string) => Promise<void>
  exportLibrary: () => Promise<PhraseLibraryResult>
  importLibrary: () => Promise<PhraseLibraryResult>
}

export const usePhrases = create<PhrasesState>((set, get) => ({
  groups: [],
  phrases: [],
  activeGroupId: null,
  loaded: false,
  load: async () => {
    const data = await window.api.phrases.getAll()
    set((st) => {
      const keep = st.activeGroupId && data.groups.some((g) => g.id === st.activeGroupId)
      return {
        groups: data.groups,
        phrases: data.phrases,
        loaded: true,
        activeGroupId: keep ? st.activeGroupId : data.groups[0]?.id ?? null
      }
    })
  },
  setActiveGroup: (id) => set({ activeGroupId: id }),
  createGroup: async (name) => {
    const g = await window.api.phrases.createGroup(name)
    await get().load()
    set({ activeGroupId: g.id })
  },
  renameGroup: async (id, name) => {
    await window.api.phrases.renameGroup(id, name)
    await get().load()
  },
  deleteGroup: async (id) => {
    await window.api.phrases.deleteGroup(id)
    await get().load()
  },
  createPhrase: async (input) => {
    await window.api.phrases.create(input)
    await get().load()
  },
  updatePhrase: async (id, patch) => {
    await window.api.phrases.update(id, patch)
    await get().load()
  },
  deletePhrase: async (id) => {
    await window.api.phrases.delete(id)
    await get().load()
  },
  exportLibrary: async () => window.api.phrases.exportLibrary(),
  importLibrary: async () => {
    const result = await window.api.phrases.importLibrary()
    if (result.ok) await get().load()
    return result
  }
}))
