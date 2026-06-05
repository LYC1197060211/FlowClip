import type { AsrConfig, ClipboardType, Settings, TranslationConfig } from './types'

export const APP_NAME = 'FlowClip'
export const APP_TAGLINE = '剪贴板 · 快捷短语 · 翻译 · 语音转写'

/** IPC channel names shared by main (handlers) and preload (bridge). */
export const IPC = {
  // clipboard
  CLIPBOARD_LIST: 'clipboard:list',
  CLIPBOARD_COPY_BACK: 'clipboard:copyBack',
  CLIPBOARD_WRITE_TEXT: 'clipboard:writeText',
  CLIPBOARD_TOGGLE_PIN: 'clipboard:togglePin',
  CLIPBOARD_DELETE: 'clipboard:delete',
  CLIPBOARD_CLEAR: 'clipboard:clearAll',
  CLIPBOARD_CHANGED: 'clipboard:changed', // event: main -> renderer
  // phrases
  PHRASES_GET_ALL: 'phrases:getAll',
  PHRASES_GROUP_CREATE: 'phrases:groups:create',
  PHRASES_GROUP_RENAME: 'phrases:groups:rename',
  PHRASES_GROUP_DELETE: 'phrases:groups:delete',
  PHRASES_CREATE: 'phrases:create',
  PHRASES_UPDATE: 'phrases:update',
  PHRASES_DELETE: 'phrases:delete',
  PHRASES_COPY: 'phrases:copy',
  PHRASES_EXPORT_LIBRARY: 'phrases:exportLibrary',
  PHRASES_IMPORT_LIBRARY: 'phrases:importLibrary',
  // translation
  TRANSLATE_RUN: 'translate:run',
  TRANSLATE_GET_CONFIG: 'translate:getConfig',
  TRANSLATE_SET_CONFIG: 'translate:setConfig',
  TRANSLATE_TEST_CONFIG: 'translate:testConfig',
  // settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_CHANGED: 'settings:changed', // event: main -> renderer
  // theme
  THEME_SET: 'theme:set',
  THEME_CHANGED: 'theme:changed', // event: main -> renderer
  // window controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_SET_ALWAYS_ON_TOP: 'window:setAlwaysOnTop',
  // popup
  POPUP_HIDE: 'popup:hide',
  POPUP_SHOW: 'popup:show', // event: main -> renderer (popup became visible)
  // voice (speech-to-text floating window)
  VOICE_HIDE: 'voice:hide',
  VOICE_SHOW: 'voice:show', // event: main -> renderer (voice window became visible)
  // asr
  ASR_TRANSCRIBE: 'asr:transcribe',
  ASR_GET_CONFIG: 'asr:getConfig',
  ASR_SET_CONFIG: 'asr:setConfig',
  ASR_TEST_CONFIG: 'asr:testConfig',
  // system
  SYSTEM_PICK_STORAGE_PATH: 'system:pickStoragePath',
  SYSTEM_OPEN_STORAGE_PATH: 'system:openStoragePath',
  SYSTEM_OPEN_USER_GUIDE: 'system:openUserGuide',
  SYSTEM_OPEN_RELEASE_NOTES: 'system:openReleaseNotes',
  SYSTEM_GET_SUPPORT_DIAGNOSTICS: 'system:getSupportDiagnostics',
  SYSTEM_OPEN_EXTERNAL: 'system:openExternal',
  SYSTEM_PASTE_CLIPBOARD: 'system:pasteClipboard',
  SHORTCUT_GET_FAILURES: 'shortcut:getFailures',
  SHORTCUT_FAILED: 'shortcut:registerFailed' // event: main -> renderer
} as const

export const DEFAULT_HOTKEY = 'Control+Alt+Space'
export const DEFAULT_VOICE_HOTKEY = 'Control+Alt+V'

export const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  defaultEngine: 'ai',
  googleApiKey: '',
  proxyUrl: '',
  apiBaseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-v4-flash',
  targetLang: 'English'
}

export const DEFAULT_ASR_CONFIG: AsrConfig = {
  baseUrl: 'https://api.siliconflow.cn/v1',
  apiKey: '',
  model: 'FunAudioLLM/SenseVoiceSmall',
  language: 'zh',
  hotwords: '',
  proxyUrl: '',
  polish: true,
  domain: ''
}

export const TRANSLATION_PROVIDER_PRESETS = [
  {
    value: 'deepseek',
    label: 'DeepSeek',
    description: 'AI 翻译常用配置',
    patch: {
      defaultEngine: 'ai',
      apiBaseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash'
    } satisfies Partial<TranslationConfig>
  },
  {
    value: 'google_free',
    label: 'Google 免费接口',
    description: '不填写 Key 也可尝试，稳定性取决于网络',
    patch: {
      defaultEngine: 'google'
    } satisfies Partial<TranslationConfig>
  },
  {
    value: 'custom_ai',
    label: 'OpenAI-compatible 自定义',
    description: '适合自定义网关、代理服务或其他兼容接口',
    patch: {
      defaultEngine: 'ai'
    } satisfies Partial<TranslationConfig>
  }
] as const

export const ASR_PROVIDER_PRESETS = [
  {
    value: 'siliconflow_sensevoice',
    label: 'SiliconFlow SenseVoice',
    description: '中文语音转写常用配置',
    patch: {
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'FunAudioLLM/SenseVoiceSmall',
      language: 'zh',
      polish: true
    } satisfies Partial<AsrConfig>
  },
  {
    value: 'openai_compatible',
    label: 'OpenAI-compatible 自定义',
    description: '适合 Whisper 兼容端点或自建网关',
    patch: {
      model: 'whisper-1',
      language: 'auto'
    } satisfies Partial<AsrConfig>
  }
] as const

export const DEFAULT_SETTINGS: Settings = {
  storagePath: null,
  retentionDays: 7,
  maxHistory: 200,
  popupHotkey: DEFAULT_HOTKEY,
  voiceHotkey: DEFAULT_VOICE_HOTKEY,
  autoPasteOnPopup: false,
  sensitiveFilterEnabled: true,
  launchOnStartup: false,
  theme: 'light',
  alwaysOnTop: false,
  translation: DEFAULT_TRANSLATION_CONFIG,
  asr: DEFAULT_ASR_CONFIG
}

export const ASR_LANGS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'auto', label: '自动检测' }
]

export const TARGET_LANGS = [
  'English',
  '简体中文',
  '繁體中文',
  '日本語',
  '한국어',
  'Français',
  'Deutsch',
  'Español',
  'Русский'
] as const

/** Filter pill order on the clipboard screen (prototype: 全部/文本/图片/链接/文件). */
export const CLIPBOARD_FILTERS: Array<{ key: ClipboardType | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'text', label: '文本' },
  { key: 'image', label: '图片' },
  { key: 'link', label: '链接' },
  { key: 'file', label: '文件' }
]

/** Per-type label + accent color (semantic color-coding from the prototype). */
export const TYPE_META: Record<ClipboardType, { label: string; color: string }> = {
  text: { label: '文本', color: '#2563eb' },
  image: { label: '图片', color: '#16a34a' },
  link: { label: '链接', color: '#ea580c' },
  file: { label: '文件', color: '#9333ea' }
}

/** Seed content created on first run (mirrors the prototype). */
export const SEED_GROUPS = [
  { name: 'Claude code指令', builtin: true },
  { name: '客服快捷短语', builtin: false }
] as const

export const SEED_PHRASES_FOR_FIRST_GROUP = [
  { content: '/context', note: '查看上下文' },
  { content: '/compact', note: '压缩上下文' },
  { content: '/resume', note: '查看历史会话' },
  { content: '/clear', note: '清除上下文' }
] as const

export const PHRASE_VARIABLES = [
  { token: '{{date}}', label: '日期', description: '本地日期' },
  { token: '{{time}}', label: '时间', description: '本地时间' },
  { token: '{{datetime}}', label: '日期时间', description: '本地日期和时间' },
  { token: '{{weekday}}', label: '星期', description: '本地星期' },
  { token: '{{clipboard}}', label: '剪贴板', description: '当前剪贴板文本' }
] as const

// Window sizes include an 8px transparent margin for the floating drop shadow.
export const MAIN_WINDOW = { width: 416, height: 676 }
export const POPUP_WINDOW = { width: 376, height: 540 }
export const VOICE_WINDOW = { width: 396, height: 332 }

/** Clipboard polling interval (ms). Electron exposes no clipboard-change event. */
export const CLIPBOARD_POLL_MS = 700
