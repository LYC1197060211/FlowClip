import { ipcMain, dialog, shell } from 'electron'
import { existsSync, cpSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { IPC } from '@shared/constants'
import type {
  AsrConfig,
  CreatePhraseInput,
  Settings,
  ThemeMode,
  TranslateRequest,
  TranslationConfig,
  UpdatePhrasePatch
} from '@shared/types'
import * as clip from '../store/clipboardRepo'
import * as phrases from '../store/phrasesRepo'
import {
  getAsrConfig,
  getSettings,
  getTranslationConfig,
  saveSettings,
  setAsrConfig,
  setTheme,
  setTranslationConfig
} from '../store/settingsRepo'
import { runTranslate, testTranslationConfig } from '../translation'
import { testAsrConfig, transcribe } from '../asr'
import { ensureDir, getBaseDir, initPaths } from '../paths'
import { applyShortcuts, getShortcutFailures } from '../shortcuts'
import { applyAutoLaunch } from '../autoLaunch'
import { getMainWindow, setAlwaysOnTop } from '../windows/mainWindow'
import { hidePopup } from '../windows/popupWindow'
import { hideVoiceWindow } from '../windows/voiceWindow'
import { pasteClipboardIntoActiveWindow } from '../paste'
import { writeClipboardText } from '../clipboard'
import { openBundledDoc } from '../docs'
import { buildSupportDiagnostics } from '../support'
import { bus, BUS } from '../bus'

export function registerIpcHandlers(): void {
  // ---- clipboard ----
  ipcMain.handle(IPC.CLIPBOARD_LIST, () => clip.list())
  ipcMain.handle(IPC.CLIPBOARD_COPY_BACK, (_e, id: string) => clip.copyBack(id))
  ipcMain.handle(IPC.CLIPBOARD_WRITE_TEXT, (_e, text: string) => {
    if (typeof text !== 'string') return false
    return writeClipboardText(text)
  })
  ipcMain.handle(IPC.CLIPBOARD_TOGGLE_PIN, (_e, id: string) => clip.togglePin(id))
  ipcMain.handle(IPC.CLIPBOARD_DELETE, (_e, id: string) => clip.remove(id))
  ipcMain.handle(IPC.CLIPBOARD_CLEAR, () => clip.clearAll())

  // ---- phrases ----
  ipcMain.handle(IPC.PHRASES_GET_ALL, () => phrases.getAll())
  ipcMain.handle(IPC.PHRASES_GROUP_CREATE, (_e, name: string) => phrases.createGroup(name))
  ipcMain.handle(IPC.PHRASES_GROUP_RENAME, (_e, id: string, name: string) =>
    phrases.renameGroup(id, name)
  )
  ipcMain.handle(IPC.PHRASES_GROUP_DELETE, (_e, id: string) => phrases.deleteGroup(id))
  ipcMain.handle(IPC.PHRASES_CREATE, (_e, input: CreatePhraseInput) => phrases.createPhrase(input))
  ipcMain.handle(IPC.PHRASES_UPDATE, (_e, id: string, patch: UpdatePhrasePatch) =>
    phrases.updatePhrase(id, patch)
  )
  ipcMain.handle(IPC.PHRASES_DELETE, (_e, id: string) => phrases.deletePhrase(id))
  ipcMain.handle(IPC.PHRASES_COPY, (_e, id: string) => phrases.copyPhrase(id))
  ipcMain.handle(IPC.PHRASES_EXPORT_LIBRARY, () => exportPhraseLibrary())
  ipcMain.handle(IPC.PHRASES_IMPORT_LIBRARY, () => importPhraseLibrary())

  // ---- translation ----
  ipcMain.handle(IPC.TRANSLATE_RUN, (_e, req: TranslateRequest) => runTranslate(req))
  ipcMain.handle(IPC.TRANSLATE_GET_CONFIG, () => getTranslationConfig())
  ipcMain.handle(IPC.TRANSLATE_SET_CONFIG, (_e, patch: Partial<TranslationConfig>) => {
    return setTranslationConfig(patch).translation
  })
  ipcMain.handle(IPC.TRANSLATE_TEST_CONFIG, (_e, cfg: TranslationConfig) =>
    testTranslationConfig(cfg)
  )

  // ---- settings ----
  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings())
  ipcMain.handle(IPC.SETTINGS_SET, (_e, patch: Partial<Settings>) => handleSettingsSet(patch))

  // ---- theme ----
  ipcMain.handle(IPC.THEME_SET, (_e, mode: ThemeMode) => {
    setTheme(mode)
  })

  // ---- window controls (fire-and-forget) ----
  ipcMain.on(IPC.WINDOW_MINIMIZE, () => getMainWindow()?.minimize())
  ipcMain.on(IPC.WINDOW_CLOSE, () => getMainWindow()?.hide())
  ipcMain.on(IPC.WINDOW_SET_ALWAYS_ON_TOP, (_e, v: boolean) => {
    saveSettings({ alwaysOnTop: v })
    setAlwaysOnTop(v)
  })

  // ---- popup ----
  ipcMain.on(IPC.POPUP_HIDE, () => hidePopup())

  // ---- voice window + ASR ----
  ipcMain.on(IPC.VOICE_HIDE, () => hideVoiceWindow())
  ipcMain.handle(IPC.ASR_TRANSCRIBE, (_e, audio: Uint8Array, opts?: { polish?: boolean }) =>
    transcribe(audio, opts)
  )
  ipcMain.handle(IPC.ASR_GET_CONFIG, () => getAsrConfig())
  ipcMain.handle(IPC.ASR_SET_CONFIG, (_e, patch: Partial<AsrConfig>) => {
    return setAsrConfig(patch).asr
  })
  ipcMain.handle(IPC.ASR_TEST_CONFIG, (_e, cfg: AsrConfig) => testAsrConfig(cfg))

  // ---- system ----
  ipcMain.handle(IPC.SYSTEM_PICK_STORAGE_PATH, async () => {
    const w = getMainWindow()
    const properties: Array<'openDirectory' | 'createDirectory'> = [
      'openDirectory',
      'createDirectory'
    ]
    const res = w
      ? await dialog.showOpenDialog(w, { properties })
      : await dialog.showOpenDialog({ properties })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })
  ipcMain.on(IPC.SYSTEM_OPEN_EXTERNAL, (_e, url: string) => {
    if (url) shell.openExternal(url)
  })
  ipcMain.handle(IPC.SYSTEM_OPEN_STORAGE_PATH, async () => {
    const dir = getBaseDir()
    ensureDir(dir)
    return (await shell.openPath(dir)) === ''
  })
  ipcMain.handle(IPC.SYSTEM_OPEN_USER_GUIDE, () => openBundledDoc('user-guide'))
  ipcMain.handle(IPC.SYSTEM_OPEN_RELEASE_NOTES, () => openBundledDoc('release-notes'))
  ipcMain.handle(IPC.SYSTEM_GET_SUPPORT_DIAGNOSTICS, () => buildSupportDiagnostics())
  ipcMain.handle(IPC.SYSTEM_PASTE_CLIPBOARD, () => pasteClipboardIntoActiveWindow())
  ipcMain.handle(IPC.SHORTCUT_GET_FAILURES, () => getShortcutFailures())
}

async function exportPhraseLibrary() {
  const w = getMainWindow()
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const options = {
    defaultPath: `FlowClip-phrases-${date}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }
  const res = w ? await dialog.showSaveDialog(w, options) : await dialog.showSaveDialog(options)
  if (res.canceled || !res.filePath) {
    return { ok: false, message: '已取消导出' }
  }
  const data = phrases.buildLibraryExport()
  writeFileSync(res.filePath, JSON.stringify(data, null, 2), 'utf8')
  return {
    ok: true,
    message: `已导出 ${data.groups.length} 个分组`,
    path: res.filePath,
    groupCount: data.groups.length,
    phraseCount: data.groups.reduce((sum, group) => sum + group.phrases.length, 0)
  }
}

async function importPhraseLibrary() {
  const w = getMainWindow()
  const options = {
    properties: ['openFile'] as Array<'openFile'>,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }
  const res = w ? await dialog.showOpenDialog(w, options) : await dialog.showOpenDialog(options)
  if (res.canceled || res.filePaths.length === 0) {
    return { ok: false, message: '已取消导入' }
  }
  try {
    const path = res.filePaths[0]
    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown
    const result = phrases.importLibrary(raw)
    return { ...result, path }
  } catch (err) {
    return {
      ok: false,
      message: (err as { message?: string })?.message || '导入失败'
    }
  }
}

function handleSettingsSet(patch: Partial<Settings>): Settings {
  const prev = getSettings()
  const storageChanged =
    patch.storagePath !== undefined && (patch.storagePath ?? null) !== (prev.storagePath ?? null)

  const next = saveSettings(patch)

  if (
    (patch.popupHotkey && patch.popupHotkey !== prev.popupHotkey) ||
    (patch.voiceHotkey && patch.voiceHotkey !== prev.voiceHotkey)
  ) {
    applyShortcuts(next.popupHotkey, next.voiceHotkey)
  }
  if (patch.launchOnStartup !== undefined && patch.launchOnStartup !== prev.launchOnStartup) {
    applyAutoLaunch(next.launchOnStartup)
  }
  if (patch.alwaysOnTop !== undefined && patch.alwaysOnTop !== prev.alwaysOnTop) {
    setAlwaysOnTop(next.alwaysOnTop)
  }
  if (patch.theme && patch.theme !== prev.theme) bus.emit(BUS.THEME_CHANGED, next.theme)
  if (storageChanged) migrateStorageAndReload(next.storagePath ?? null)

  return next
}

/** Relocate data to a new storage path (copying existing files) and reload. */
function migrateStorageAndReload(newPath: string | null): void {
  const oldBase = getBaseDir()
  initPaths(newPath)
  const newBase = getBaseDir()
  if (oldBase !== newBase) {
    try {
      for (const f of ['clipboard.json', 'phrases.json']) {
        const src = join(oldBase, f)
        const dst = join(newBase, f)
        if (existsSync(src) && !existsSync(dst)) cpSync(src, dst)
      }
      const srcImg = join(oldBase, 'clipboard-images')
      const dstImg = join(newBase, 'clipboard-images')
      if (existsSync(srcImg) && !existsSync(dstImg)) cpSync(srcImg, dstImg, { recursive: true })
    } catch {
      /* best effort */
    }
  }
  phrases.loadPhrases()
  clip.reloadClipboard()
}
