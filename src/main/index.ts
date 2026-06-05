import { app, BrowserWindow, session } from 'electron'
import { IPC } from '@shared/constants'
import { bus, BUS } from './bus'
import { initPaths } from './paths'
import { getSettings, loadSettings } from './store/settingsRepo'
import { cleanup as clipboardCleanup, loadClipboard } from './store/clipboardRepo'
import { loadPhrases } from './store/phrasesRepo'
import { createMainWindow, setQuitting, showMainWindow } from './windows/mainWindow'
import { createTray, rebuildTrayMenu } from './tray'
import { applyShortcuts, unregisterAllShortcuts } from './shortcuts'
import { applyAutoLaunch, startedHidden } from './autoLaunch'
import { startClipboardWatcher, stopClipboardWatcher } from './clipboard/watcher'
import { registerIpcHandlers } from './ipc/handlers'

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function broadcast(channel: string, payload?: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload)
  }
}

function init(): void {
  // Settings first — they decide the storage path for everything else.
  loadSettings()
  const s = getSettings()
  initPaths(s.storagePath)
  loadPhrases()
  loadClipboard()

  registerIpcHandlers()

  // Allow microphone access for the speech-to-text feature (local content only).
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) =>
    cb(permission === 'media')
  )
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === 'media')

  // Forward internal events to all renderer windows.
  bus.on(BUS.CLIPBOARD_CHANGED, (items) => broadcast(IPC.CLIPBOARD_CHANGED, items))
  bus.on(BUS.SETTINGS_CHANGED, (next) => {
    broadcast(IPC.SETTINGS_CHANGED, next)
    rebuildTrayMenu()
  })
  bus.on(BUS.THEME_CHANGED, (mode) => broadcast(IPC.THEME_CHANGED, mode))

  createMainWindow()
  createTray()
  applyShortcuts(s.popupHotkey, s.voiceHotkey)
  applyAutoLaunch(s.launchOnStartup)
  startClipboardWatcher()

  if (!startedHidden()) showMainWindow()

  // Periodic retention cleanup.
  cleanupTimer = setInterval(() => clipboardCleanup(true), 5 * 60 * 1000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => showMainWindow())
  app.whenReady().then(init)
}

// Tray-resident: do not quit when all windows are closed.
app.on('window-all-closed', () => {
  /* keep running in the tray */
})

app.on('before-quit', () => {
  setQuitting(true)
  stopClipboardWatcher()
  unregisterAllShortcuts()
  if (cleanupTimer) clearInterval(cleanupTimer)
})
