import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { APP_NAME, POPUP_WINDOW, IPC } from '@shared/constants'

let popup: BrowserWindow | null = null

const RENDERER_URL = process.env['ELECTRON_RENDERER_URL']

export function getPopupWindow(): BrowserWindow | null {
  return popup && !popup.isDestroyed() ? popup : null
}

export function createPopupWindow(): BrowserWindow {
  if (popup && !popup.isDestroyed()) return popup

  popup = new BrowserWindow({
    width: POPUP_WINDOW.width,
    height: POPUP_WINDOW.height,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    title: APP_NAME,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  popup.setAlwaysOnTop(true, 'screen-saver')

  // Dismiss when focus is lost (clicking elsewhere) — requires focusable:true.
  popup.on('blur', () => popup?.hide())

  if (RENDERER_URL) popup.loadURL(`${RENDERER_URL}/popup.html`)
  else popup.loadFile(join(__dirname, '../renderer/popup.html'))

  return popup
}

export function hidePopup(): void {
  getPopupWindow()?.hide()
}

export function showPopupAtCursor(): void {
  const w = createPopupWindow()
  const cursor = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursor)
  const { x: ax, y: ay, width: aw, height: ah } = display.workArea
  const [pw, ph] = w.getSize()

  let x = cursor.x + 8
  let y = cursor.y + 8
  if (x + pw > ax + aw) x = cursor.x - pw - 8
  if (y + ph > ay + ah) y = ay + ah - ph - 8
  x = Math.max(ax + 8, Math.min(x, ax + aw - pw - 8))
  y = Math.max(ay + 8, Math.min(y, ay + ah - ph - 8))

  w.setPosition(Math.round(x), Math.round(y))
  // Tell the popup renderer to refresh its data and reset to the first tab.
  w.webContents.send(IPC.POPUP_SHOW)
  w.show()
  w.focus()
}

export function togglePopup(): void {
  const w = getPopupWindow()
  if (w && w.isVisible()) {
    w.hide()
    return
  }
  showPopupAtCursor()
}
