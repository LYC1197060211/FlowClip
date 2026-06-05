import { app } from 'electron'

/** Reflect the launch-on-startup setting into the OS login items. */
export function applyAutoLaunch(enabled: boolean): void {
  // Login items are only meaningful for the packaged app (a stable exe path).
  if (!app.isPackaged) return
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: ['--hidden']
  })
}

/** True when the app was launched by the OS at login or with --hidden. */
export function startedHidden(): boolean {
  if (process.argv.includes('--hidden')) return true
  try {
    return app.getLoginItemSettings().wasOpenedAtLogin
  } catch {
    return false
  }
}
