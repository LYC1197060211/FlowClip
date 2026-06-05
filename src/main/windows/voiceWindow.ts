import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { APP_NAME, VOICE_WINDOW, IPC } from '@shared/constants'

let voice: BrowserWindow | null = null

const RENDERER_URL = process.env['ELECTRON_RENDERER_URL']

export function getVoiceWindow(): BrowserWindow | null {
  return voice && !voice.isDestroyed() ? voice : null
}

export function createVoiceWindow(): BrowserWindow {
  if (voice && !voice.isDestroyed()) return voice

  voice = new BrowserWindow({
    width: VOICE_WINDOW.width,
    height: VOICE_WINDOW.height,
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

  voice.setAlwaysOnTop(true, 'screen-saver')
  // Intentionally NOT hidden on blur: the user may click the target app while
  // dictating. It is dismissed explicitly (× / Esc) from the renderer.

  if (RENDERER_URL) voice.loadURL(`${RENDERER_URL}/voice.html`)
  else voice.loadFile(join(__dirname, '../renderer/voice.html'))

  return voice
}

export function hideVoiceWindow(): void {
  getVoiceWindow()?.hide()
}

export function showVoiceWindow(): void {
  const w = createVoiceWindow()
  const cursor = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursor)
  const { x: ax, y: ay, width: aw, height: ah } = display.workArea
  const [pw, ph] = w.getSize()

  // Centered horizontally on the active display, in the upper third.
  let x = ax + Math.round((aw - pw) / 2)
  let y = ay + Math.round(ah * 0.18)
  x = Math.max(ax + 8, Math.min(x, ax + aw - pw - 8))
  y = Math.max(ay + 8, Math.min(y, ay + ah - ph - 8))

  w.setPosition(x, y)
  w.webContents.send(IPC.VOICE_SHOW)
  w.show()
  w.focus()
}

export function toggleVoiceWindow(): void {
  const w = getVoiceWindow()
  if (w && w.isVisible()) {
    w.hide()
    return
  }
  showVoiceWindow()
}
