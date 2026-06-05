import { clipboard } from 'electron'
import { basename } from 'path'

export interface CopiedFiles {
  /** basename of the first copied file */
  fileName: string
  /** absolute path of the first copied file */
  fullPath?: string
  /** number of files copied */
  fileCount: number
}

/**
 * Best-effort detection of a Windows file copy.
 * Tries the raw CF_HDROP structure first (full multi-file support), then falls
 * back to the FileNameW format (single file path, UTF-16LE). Returns null when
 * the clipboard does not hold a file drop. Reading a missing format yields an
 * empty buffer, so this is safe to call on every poll.
 */
export function readClipboardFiles(): CopiedFiles | null {
  try {
    const buf = clipboard.readBuffer('CF_HDROP')
    if (buf && buf.length >= 20) {
      const paths = parseHDrop(buf)
      if (paths.length) {
        return { fileName: basename(paths[0]), fullPath: paths[0], fileCount: paths.length }
      }
    }
  } catch {
    /* not present */
  }
  try {
    const buf = clipboard.readBuffer('FileNameW')
    if (buf && buf.length) {
      const p = decodeUtf16Z(buf, 0)
      if (p) return { fileName: basename(p), fullPath: p, fileCount: 1 }
    }
  } catch {
    /* not present */
  }
  return null
}

/** Parse a Windows DROPFILES (CF_HDROP) buffer into a list of paths. */
function parseHDrop(buf: Buffer): string[] {
  // DROPFILES: DWORD pFiles; POINT pt(8); BOOL fNC(4); BOOL fWide(4) -> 20-byte header
  const pFiles = buf.readUInt32LE(0)
  const fWide = buf.readUInt32LE(16) !== 0
  const paths: string[] = []

  if (fWide) {
    let offset = pFiles
    while (offset + 1 < buf.length) {
      let end = offset
      while (end + 1 < buf.length && !(buf[end] === 0 && buf[end + 1] === 0)) end += 2
      if (end === offset) break // empty string -> end of list
      paths.push(buf.toString('utf16le', offset, end))
      offset = end + 2
    }
  } else {
    let offset = pFiles
    while (offset < buf.length) {
      let end = offset
      while (end < buf.length && buf[end] !== 0) end++
      if (end === offset) break
      paths.push(buf.toString('latin1', offset, end))
      offset = end + 1
    }
  }
  return paths
}

/** Decode a UTF-16LE string starting at `start`, stopping at the NUL terminator. */
function decodeUtf16Z(buf: Buffer, start: number): string {
  let end = buf.length
  for (let i = start; i + 1 < buf.length; i += 2) {
    if (buf[i] === 0 && buf[i + 1] === 0) {
      end = i
      break
    }
  }
  return buf.toString('utf16le', start, end).trim()
}
