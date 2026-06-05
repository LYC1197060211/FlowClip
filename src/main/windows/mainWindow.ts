import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { APP_NAME, MAIN_WINDOW } from '@shared/constants'
import { getSettings } from '../store/settingsRepo'

let win: BrowserWindow | null = null
let quitting = false

const RENDERER_URL = process.env['ELECTRON_RENDERER_URL']

export function setQuitting(v: boolean): void {
  quitting = v
}

export function getMainWindow(): BrowserWindow | null {
  return win && !win.isDestroyed() ? win : null
}

export function createMainWindow(): BrowserWindow {
  if (win && !win.isDestroyed()) return win

  const s = getSettings()
  win = new BrowserWindow({
    width: MAIN_WINDOW.width,
    height: MAIN_WINDOW.height,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: s.alwaysOnTop,
    title: APP_NAME,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win?.show())

  // Close (×) and OS-level close hide to tray unless we are really quitting.
  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      win?.hide()
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (RENDERER_URL) win.loadURL(RENDERER_URL)
  else win.loadFile(join(__dirname, '../renderer/index.html'))

  return win
}

export function showMainWindow(): void {
  const w = createMainWindow()
  if (w.isMinimized()) w.restore()
  w.show()
  w.focus()
}

export function toggleMainWindow(): void {
  const w = createMainWindow()
  if (w.isVisible() && !w.isMinimized()) w.hide()
  else {
    if (w.isMinimized()) w.restore()
    w.show()
    w.focus()
  }
}

export function setAlwaysOnTop(v: boolean): void {
  getMainWindow()?.setAlwaysOnTop(v)
}
