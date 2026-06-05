import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/constants'
import type { FlowClipApi } from '@shared/types'

/** Subscribe to a main->renderer push channel; returns an unsubscribe fn. */
function on(channel: string, cb: (...args: unknown[]) => void): () => void {
  const listener = (_e: unknown, ...args: unknown[]): void => cb(...args)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: FlowClipApi = {
  clipboard: {
    list: () => ipcRenderer.invoke(IPC.CLIPBOARD_LIST),
    copyBack: (id) => ipcRenderer.invoke(IPC.CLIPBOARD_COPY_BACK, id),
    writeText: (text) => ipcRenderer.invoke(IPC.CLIPBOARD_WRITE_TEXT, text),
    togglePin: (id) => ipcRenderer.invoke(IPC.CLIPBOARD_TOGGLE_PIN, id),
    delete: (id) => ipcRenderer.invoke(IPC.CLIPBOARD_DELETE, id),
    clearAll: () => ipcRenderer.invoke(IPC.CLIPBOARD_CLEAR),
    onChanged: (cb) => on(IPC.CLIPBOARD_CHANGED, (items) => cb(items as never))
  },
  phrases: {
    getAll: () => ipcRenderer.invoke(IPC.PHRASES_GET_ALL),
    createGroup: (name) => ipcRenderer.invoke(IPC.PHRASES_GROUP_CREATE, name),
    renameGroup: (id, name) => ipcRenderer.invoke(IPC.PHRASES_GROUP_RENAME, id, name),
    deleteGroup: (id) => ipcRenderer.invoke(IPC.PHRASES_GROUP_DELETE, id),
    create: (input) => ipcRenderer.invoke(IPC.PHRASES_CREATE, input),
    update: (id, patch) => ipcRenderer.invoke(IPC.PHRASES_UPDATE, id, patch),
    delete: (id) => ipcRenderer.invoke(IPC.PHRASES_DELETE, id),
    copy: (id) => ipcRenderer.invoke(IPC.PHRASES_COPY, id),
    exportLibrary: () => ipcRenderer.invoke(IPC.PHRASES_EXPORT_LIBRARY),
    importLibrary: () => ipcRenderer.invoke(IPC.PHRASES_IMPORT_LIBRARY)
  },
  translate: {
    run: (req) => ipcRenderer.invoke(IPC.TRANSLATE_RUN, req),
    getConfig: () => ipcRenderer.invoke(IPC.TRANSLATE_GET_CONFIG),
    setConfig: (patch) => ipcRenderer.invoke(IPC.TRANSLATE_SET_CONFIG, patch),
    testConfig: (cfg) => ipcRenderer.invoke(IPC.TRANSLATE_TEST_CONFIG, cfg)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    set: (patch) => ipcRenderer.invoke(IPC.SETTINGS_SET, patch),
    onChanged: (cb) => on(IPC.SETTINGS_CHANGED, (s) => cb(s as never))
  },
  theme: {
    set: (mode) => ipcRenderer.invoke(IPC.THEME_SET, mode),
    onChanged: (cb) => on(IPC.THEME_CHANGED, (mode) => cb(mode as never))
  },
  window: {
    minimize: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
    close: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
    setAlwaysOnTop: (v) => ipcRenderer.send(IPC.WINDOW_SET_ALWAYS_ON_TOP, v)
  },
  popup: {
    hide: () => ipcRenderer.send(IPC.POPUP_HIDE),
    onShow: (cb) => on(IPC.POPUP_SHOW, () => cb())
  },
  voice: {
    hide: () => ipcRenderer.send(IPC.VOICE_HIDE),
    onShow: (cb) => on(IPC.VOICE_SHOW, () => cb())
  },
  asr: {
    transcribe: (audio, opts) => ipcRenderer.invoke(IPC.ASR_TRANSCRIBE, audio, opts),
    getConfig: () => ipcRenderer.invoke(IPC.ASR_GET_CONFIG),
    setConfig: (patch) => ipcRenderer.invoke(IPC.ASR_SET_CONFIG, patch),
    testConfig: (cfg) => ipcRenderer.invoke(IPC.ASR_TEST_CONFIG, cfg)
  },
  system: {
    pickStoragePath: () => ipcRenderer.invoke(IPC.SYSTEM_PICK_STORAGE_PATH),
    openStoragePath: () => ipcRenderer.invoke(IPC.SYSTEM_OPEN_STORAGE_PATH),
    openUserGuide: () => ipcRenderer.invoke(IPC.SYSTEM_OPEN_USER_GUIDE),
    openReleaseNotes: () => ipcRenderer.invoke(IPC.SYSTEM_OPEN_RELEASE_NOTES),
    getSupportDiagnostics: () => ipcRenderer.invoke(IPC.SYSTEM_GET_SUPPORT_DIAGNOSTICS),
    openExternal: (url) => ipcRenderer.send(IPC.SYSTEM_OPEN_EXTERNAL, url),
    pasteClipboard: () => ipcRenderer.invoke(IPC.SYSTEM_PASTE_CLIPBOARD),
    getShortcutFailures: () => ipcRenderer.invoke(IPC.SHORTCUT_GET_FAILURES),
    onShortcutFailed: (cb) => on(IPC.SHORTCUT_FAILED, (a) => cb(a as never))
  }
}

contextBridge.exposeInMainWorld('api', api)
