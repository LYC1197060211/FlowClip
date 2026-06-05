import { clipboard } from 'electron'
import { CLIPBOARD_POLL_MS } from '@shared/constants'
import { addFile, addImage, addLink, addText } from '../store/clipboardRepo'
import { getSettings } from '../store/settingsRepo'
import { readClipboardFiles } from './fileFormats'
import { isSensitiveClipboardText } from './sensitive'

/**
 * Clipboard history capture. Electron exposes no clipboard-change event, so we
 * poll. A lightweight signature de-bounces unchanged content. Detection order
 * is most-specific-first: file drop -> bitmap image -> link/text.
 */

let timer: ReturnType<typeof setInterval> | null = null
let lastSig = ''
let started = false

const URL_RE = /^(https?:\/\/|www\.)\S+$/i

function isLink(text: string): boolean {
  const t = text.trim()
  return URL_RE.test(t) && !/\s/.test(t)
}

type Probe = { sig: string; act: () => void } | null

function probe(): Probe {
  const formats = clipboard.availableFormats()
  const text = clipboard.readText()

  const files = readClipboardFiles()
  if (files) {
    return {
      sig: 'file:' + (files.fullPath ?? files.fileName) + ':' + files.fileCount,
      act: () => addFile(files)
    }
  }

  const hasImage = formats.some((f) => f.startsWith('image/'))
  if (hasImage && !text) {
    const img = clipboard.readImage()
    if (!img.isEmpty()) {
      const size = img.getSize()
      const png = img.toPNG()
      return {
        sig: 'image:' + size.width + 'x' + size.height + ':' + png.byteLength,
        act: () => addImage(img)
      }
    }
  }

  if (text) {
    if (getSettings().sensitiveFilterEnabled && isSensitiveClipboardText(text)) {
      return { sig: 'sensitive:' + text, act: () => undefined }
    }
    return { sig: 'text:' + text, act: () => (isLink(text) ? addLink(text) : addText(text)) }
  }

  return null
}

function tick(): void {
  try {
    const p = probe()
    if (!p) return
    if (p.sig !== lastSig) {
      lastSig = p.sig
      p.act()
    }
  } catch {
    /* transient clipboard access errors are ignored */
  }
}

export function startClipboardWatcher(): void {
  if (started) return
  started = true
  // Prime the signature with the current clipboard so pre-existing content
  // isn't captured on launch.
  try {
    const p = probe()
    if (p) lastSig = p.sig
  } catch {
    /* ignore */
  }
  timer = setInterval(tick, CLIPBOARD_POLL_MS)
}

export function stopClipboardWatcher(): void {
  if (timer) clearInterval(timer)
  timer = null
  started = false
}
