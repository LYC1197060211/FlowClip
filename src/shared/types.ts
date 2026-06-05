// Shared domain types used by both the main and renderer processes.

export type ClipboardType = 'text' | 'image' | 'link' | 'file'

export interface ClipboardItem {
  id: string
  type: ClipboardType
  /** text content (type: text) */
  text?: string
  /** url (type: link) */
  url?: string
  /** basename of the first copied file (type: file) */
  fileName?: string
  /** absolute path of the first copied file (type: file) */
  fullPath?: string
  /** number of files copied (type: file) */
  fileCount?: number
  /** absolute path to the stored png on disk (type: image) */
  imagePath?: string
  /** small data url for fast list rendering (type: image) */
  thumbDataUrl?: string
  width?: number
  height?: number
  sizeBytes?: number
  createdAt: number
  pinned?: boolean
}

export interface PhraseGroup {
  id: string
  name: string
  order: number
  builtin?: boolean
}

export interface Phrase {
  id: string
  groupId: string
  content: string
  note?: string
  order: number
  createdAt: number
}

export interface PhrasesData {
  groups: PhraseGroup[]
  phrases: Phrase[]
}

export interface PhraseLibraryGroup {
  name: string
  phrases: Array<{
    content: string
    note?: string
  }>
}

export interface PhraseLibraryExport {
  app: 'FlowClip'
  kind: 'phrase-library'
  version: 1
  exportedAt: number
  groups: PhraseLibraryGroup[]
}

export interface PhraseLibraryResult {
  ok: boolean
  message: string
  path?: string
  groupCount?: number
  phraseCount?: number
  skippedCount?: number
}

export type TranslationEngine = 'google' | 'ai'

export interface TranslationConfig {
  defaultEngine: TranslationEngine
  googleApiKey: string
  proxyUrl: string
  apiBaseUrl: string
  apiKey: string
  model: string
  targetLang: string
}

export type ThemeMode = 'light' | 'dark'

export type RetentionDays = number | 'forever'

export interface Settings {
  storagePath: string | null
  retentionDays: RetentionDays
  maxHistory: number
  popupHotkey: string
  voiceHotkey: string
  autoPasteOnPopup: boolean
  sensitiveFilterEnabled: boolean
  launchOnStartup: boolean
  theme: ThemeMode
  alwaysOnTop: boolean
  translation: TranslationConfig
  asr: AsrConfig
}

export interface TranslateRequest {
  text: string
  targetLang: string
  engine?: TranslationEngine
}

/** 'HTTP_<code>' is also possible at runtime. */
export type TranslateErrorCode =
  | 'MISSING_API_KEY'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'EMPTY_RESULT'
  | 'EMPTY_INPUT'
  | string

export interface TranslateResult {
  ok: boolean
  text?: string
  engine: TranslationEngine
  error?: TranslateErrorCode
  message?: string
  details?: string[]
}

export interface ConnectionTestResult {
  ok: boolean
  message: string
  error?: string
  details?: string[]
}

export interface AsrConfig {
  /** OpenAI-compatible base URL, including /v1 (e.g. https://api.siliconflow.cn/v1) */
  baseUrl: string
  apiKey: string
  model: string
  /** 'zh' | 'en' | 'ja' | 'ko' | 'auto' — 'auto' omits the language hint */
  language: string
  /** prompt / hotwords to bias recognition toward domain terms */
  hotwords: string
  proxyUrl: string
  /** post-process the transcript with the AI (DeepSeek) for punctuation + terminology */
  polish: boolean
  /** optional domain hint for polishing, e.g. 医疗 / 法律 / IT */
  domain: string
}

export interface AsrResult {
  ok: boolean
  text?: string
  error?: string
  message?: string
  details?: string[]
}

export interface CreatePhraseInput {
  groupId: string
  content: string
  note?: string
}

export interface UpdatePhrasePatch {
  content?: string
  note?: string
}

/** The typed surface exposed on `window.api` by the preload script. */
export interface FlowClipApi {
  clipboard: {
    list: () => Promise<ClipboardItem[]>
    copyBack: (id: string) => Promise<boolean>
    writeText: (text: string) => Promise<boolean>
    togglePin: (id: string) => Promise<boolean>
    delete: (id: string) => Promise<void>
    clearAll: () => Promise<void>
    onChanged: (cb: (items: ClipboardItem[]) => void) => () => void
  }
  phrases: {
    getAll: () => Promise<PhrasesData>
    createGroup: (name: string) => Promise<PhraseGroup>
    renameGroup: (id: string, name: string) => Promise<void>
    deleteGroup: (id: string) => Promise<void>
    create: (input: CreatePhraseInput) => Promise<Phrase>
    update: (id: string, patch: UpdatePhrasePatch) => Promise<void>
    delete: (id: string) => Promise<void>
    copy: (id: string) => Promise<boolean>
    exportLibrary: () => Promise<PhraseLibraryResult>
    importLibrary: () => Promise<PhraseLibraryResult>
  }
  translate: {
    run: (req: TranslateRequest) => Promise<TranslateResult>
    getConfig: () => Promise<TranslationConfig>
    setConfig: (patch: Partial<TranslationConfig>) => Promise<TranslationConfig>
    testConfig: (cfg: TranslationConfig) => Promise<ConnectionTestResult>
  }
  settings: {
    get: () => Promise<Settings>
    set: (patch: Partial<Settings>) => Promise<Settings>
    onChanged: (cb: (s: Settings) => void) => () => void
  }
  theme: {
    set: (mode: ThemeMode) => Promise<void>
    onChanged: (cb: (mode: ThemeMode) => void) => () => void
  }
  window: {
    minimize: () => void
    close: () => void
    setAlwaysOnTop: (v: boolean) => void
  }
  popup: {
    hide: () => void
    onShow: (cb: () => void) => () => void
  }
  voice: {
    hide: () => void
    onShow: (cb: () => void) => () => void
  }
  asr: {
    transcribe: (audio: Uint8Array, opts?: { polish?: boolean }) => Promise<AsrResult>
    getConfig: () => Promise<AsrConfig>
    setConfig: (patch: Partial<AsrConfig>) => Promise<AsrConfig>
    testConfig: (cfg: AsrConfig) => Promise<ConnectionTestResult>
  }
  system: {
    pickStoragePath: () => Promise<string | null>
    openStoragePath: () => Promise<boolean>
    openUserGuide: () => Promise<boolean>
    openReleaseNotes: () => Promise<boolean>
    getSupportDiagnostics: () => Promise<string>
    openExternal: (url: string) => void
    pasteClipboard: () => Promise<boolean>
    getShortcutFailures: () => Promise<string[]>
    onShortcutFailed: (cb: (accelerator: string) => void) => () => void
  }
}
