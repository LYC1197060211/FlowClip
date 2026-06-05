import type {
  CreatePhraseInput,
  Phrase,
  PhraseGroup,
  PhraseLibraryExport,
  PhraseLibraryGroup,
  PhraseLibraryResult,
  PhrasesData,
  UpdatePhrasePatch
} from '@shared/types'
import { SEED_GROUPS, SEED_PHRASES_FOR_FIRST_GROUP } from '@shared/constants'
import { phrasesFile } from '../paths'
import { readJson, writeJson, uid } from './index'
import { writeClipboardText } from '../clipboard'
import { expandPhraseVariables } from '../phrases/variables'

let groups: PhraseGroup[] = []
let phrases: Phrase[] = []

export function loadPhrases(): void {
  const data = readJson<PhrasesData | null>(phrasesFile(), null)
  if (!data || !Array.isArray(data.groups) || data.groups.length === 0) {
    seed()
  } else {
    groups = data.groups
    phrases = Array.isArray(data.phrases) ? data.phrases : []
  }
}

function seed(): void {
  const now = Date.now()
  groups = SEED_GROUPS.map((g, i) => ({ id: uid(), name: g.name, order: i, builtin: g.builtin }))
  phrases = SEED_PHRASES_FOR_FIRST_GROUP.map((p, i) => ({
    id: uid(),
    groupId: groups[0].id,
    content: p.content,
    note: p.note,
    order: i,
    createdAt: now + i
  }))
  persist()
}

function persist(): void {
  writeJson(phrasesFile(), { groups, phrases } satisfies PhrasesData)
}

function sortedGroups(): PhraseGroup[] {
  return [...groups].sort((a, b) => a.order - b.order)
}

function sortedPhrases(): Phrase[] {
  return [...phrases].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
}

export function getAll(): PhrasesData {
  return {
    groups: sortedGroups(),
    phrases: sortedPhrases()
  }
}

export function createGroup(name: string): PhraseGroup {
  const group: PhraseGroup = {
    id: uid(),
    name: name.trim() || '未命名分组',
    order: groups.length
  }
  groups.push(group)
  persist()
  return group
}

export function renameGroup(id: string, name: string): void {
  const g = groups.find((x) => x.id === id)
  if (g) {
    g.name = name.trim() || g.name
    persist()
  }
}

export function deleteGroup(id: string): void {
  groups = groups.filter((g) => g.id !== id)
  phrases = phrases.filter((p) => p.groupId !== id)
  // re-pack order
  groups.forEach((g, i) => (g.order = i))
  persist()
}

export function createPhrase(input: CreatePhraseInput): Phrase {
  const order = phrases.filter((p) => p.groupId === input.groupId).length
  const phrase: Phrase = {
    id: uid(),
    groupId: input.groupId,
    content: input.content,
    note: input.note?.trim() || undefined,
    order,
    createdAt: Date.now()
  }
  phrases.push(phrase)
  persist()
  return phrase
}

export function updatePhrase(id: string, patch: UpdatePhrasePatch): void {
  const p = phrases.find((x) => x.id === id)
  if (p) {
    if (patch.content !== undefined) p.content = patch.content
    if (patch.note !== undefined) p.note = patch.note.trim() || undefined
    persist()
  }
}

export function deletePhrase(id: string): void {
  phrases = phrases.filter((p) => p.id !== id)
  persist()
}

/** Copy a phrase's content to the system clipboard. */
export function copyPhrase(id: string): boolean {
  const p = phrases.find((x) => x.id === id)
  if (!p) return false
  return writeClipboardText(expandPhraseVariables(p.content))
}

export function buildLibraryExport(): PhraseLibraryExport {
  return {
    app: 'FlowClip',
    kind: 'phrase-library',
    version: 1,
    exportedAt: Date.now(),
    groups: sortedGroups().map((group) => ({
      name: group.name,
      phrases: sortedPhrases()
        .filter((phrase) => phrase.groupId === group.id)
        .map((phrase) => ({
          content: phrase.content,
          ...(phrase.note ? { note: phrase.note } : {})
        }))
    }))
  }
}

export function importLibrary(raw: unknown): PhraseLibraryResult {
  const data = parseLibrary(raw)
  let groupCount = 0
  let phraseCount = 0
  let skippedCount = 0

  for (const incomingGroup of data.groups) {
    const groupName = incomingGroup.name.trim() || '导入短语'
    let group = groups.find((g) => g.name === groupName)
    if (!group) {
      group = { id: uid(), name: groupName, order: groups.length }
      groups.push(group)
      groupCount += 1
    }

    for (const incomingPhrase of incomingGroup.phrases) {
      const content = incomingPhrase.content.trim()
      const note = incomingPhrase.note?.trim() || undefined
      if (!content) {
        skippedCount += 1
        continue
      }
      const duplicate = phrases.some(
        (p) => p.groupId === group.id && p.content === content && (p.note ?? '') === (note ?? '')
      )
      if (duplicate) {
        skippedCount += 1
        continue
      }
      phrases.push({
        id: uid(),
        groupId: group.id,
        content,
        note,
        order: phrases.filter((p) => p.groupId === group.id).length,
        createdAt: Date.now() + phraseCount
      })
      phraseCount += 1
    }
  }

  persist()
  return {
    ok: true,
    message: `已导入 ${phraseCount} 条短语`,
    groupCount,
    phraseCount,
    skippedCount
  }
}

function parseLibrary(raw: unknown): PhraseLibraryExport {
  if (!raw || typeof raw !== 'object') throw new Error('不是有效的短语库文件')
  const data = raw as Partial<PhraseLibraryExport>
  if (data.app !== 'FlowClip' || data.kind !== 'phrase-library' || data.version !== 1) {
    throw new Error('不是 FlowClip 短语库文件')
  }
  if (!Array.isArray(data.groups)) throw new Error('短语库缺少分组数据')
  return {
    app: 'FlowClip',
    kind: 'phrase-library',
    version: 1,
    exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : Date.now(),
    groups: data.groups.map(normalizeImportGroup)
  }
}

function normalizeImportGroup(group: unknown): PhraseLibraryGroup {
  if (!group || typeof group !== 'object') return { name: '导入短语', phrases: [] }
  const raw = group as Partial<PhraseLibraryGroup>
  return {
    name: typeof raw.name === 'string' ? raw.name : '导入短语',
    phrases: Array.isArray(raw.phrases)
      ? raw.phrases.map((phrase) => {
          const p = phrase as { content?: unknown; note?: unknown }
          return {
            content: typeof p.content === 'string' ? p.content : '',
            ...(typeof p.note === 'string' ? { note: p.note } : {})
          }
        })
      : []
  }
}
