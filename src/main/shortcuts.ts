import { globalShortcut } from 'electron'
import { IPC } from '@shared/constants'
import { getMainWindow } from './windows/mainWindow'
import { togglePopup } from './windows/popupWindow'
import { toggleVoiceWindow } from './windows/voiceWindow'

const current = { popup: '', voice: '' }
const failures = new Set<string>()

/**
 * Register a global accelerator. On failure (e.g. taken by another app/IME),
 * notify the renderer and try to keep the previous working binding.
 */
function tryRegister(accel: string, fn: () => void, prev: string): string {
  if (!accel) return ''
  let ok = false
  try {
    ok = globalShortcut.register(accel, fn)
  } catch {
    ok = false
  }
  if (ok) return accel
  failures.add(accel)
  getMainWindow()?.webContents.send(IPC.SHORTCUT_FAILED, accel)
  if (prev && prev !== accel) {
    try {
      if (globalShortcut.register(prev, fn)) return prev
    } catch {
      /* ignore */
    }
  }
  return ''
}

/** (Re)register both global hotkeys. */
export function applyShortcuts(popupHotkey: string, voiceHotkey: string): void {
  globalShortcut.unregisterAll()
  failures.clear()
  current.popup = tryRegister(popupHotkey, () => togglePopup(), current.popup)
  current.voice = tryRegister(voiceHotkey, () => toggleVoiceWindow(), current.voice)
}

export function getShortcutFailures(): string[] {
  return [...failures]
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
  current.popup = ''
  current.voice = ''
}
