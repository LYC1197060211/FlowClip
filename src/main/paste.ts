import { execFile } from 'child_process'

const PASTE_DELAY_MS = 120
const PASTE_TIMEOUT_MS = 3000

/** Best-effort Windows paste into the foreground app after a floating panel closes. */
export async function pasteClipboardIntoActiveWindow(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, PASTE_DELAY_MS))

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-STA',
        '-WindowStyle',
        'Hidden',
        '-Command',
        "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"
      ],
      { windowsHide: true, timeout: PASTE_TIMEOUT_MS },
      (err) => resolve(!err)
    )
  })
}
