import { nativeImage, type NativeImage } from 'electron'
import { existsSync, unlinkSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { ClipboardItem } from '@shared/types'
import { clipboardFile, imagesDir, ensureDir } from '../paths'
import { readJson, writeJson, uid } from './index'
import { getSettings } from './settingsRepo'
import { writeClipboardImage, writeClipboardText } from '../clipboard'
import { bus, BUS } from '../bus'

interface ClipboardData {
  items: ClipboardItem[]
}

let items: ClipboardItem[] = []

export function loadClipboard(): void {
  const data = readJson<ClipboardData>(clipboardFile(), { items: [] })
  items = Array.isArray(data.items) ? data.items : []
  cleanup(false)
  sweepOrphanImages()
}

function persist(): void {
  writeJson(clipboardFile(), { items } satisfies ClipboardData)
}

function emit(): void {
  bus.emit(BUS.CLIPBOARD_CHANGED, list())
}

/** Newest first, pinned items always on top. */
export function list(): ClipboardItem[] {
  return [...items].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt
  )
}

function byId(id: string): ClipboardItem | undefined {
  return items.find((i) => i.id === id)
}

/** imagePath is stored as a bare filename; resolve against the current images dir. */
function imageFullPath(item: ClipboardItem): string | null {
  return item.imagePath ? join(imagesDir(), item.imagePath) : null
}

function removeImageFile(item: ClipboardItem): void {
  const full = imageFullPath(item)
  if (!full) return
  try {
    if (existsSync(full)) unlinkSync(full)
  } catch {
    /* ignore */
  }
}

/** Stable signature used to de-duplicate / bump re-copied content. */
function keyOf(i: ClipboardItem): string {
  switch (i.type) {
    case 'text':
      return 't:' + (i.text ?? '')
    case 'link':
      return 'l:' + (i.url ?? '')
    case 'file':
      return 'f:' + (i.fullPath ?? i.fileName ?? '') + ':' + (i.fileCount ?? 1)
    case 'image':
      return 'i:' + (i.width ?? 0) + 'x' + (i.height ?? 0) + ':' + (i.sizeBytes ?? 0)
  }
}

function bump(item: ClipboardItem): void {
  items = items.filter((i) => i.id !== item.id)
  item.createdAt = Date.now()
  items.unshift(item)
  persist()
  emit()
}

function insert(item: ClipboardItem): void {
  const existing = items.find((i) => keyOf(i) === keyOf(item))
  if (existing) {
    bump(existing)
    return
  }
  items.unshift(item)
  cleanup(false)
  persist()
  emit()
}

export function addText(text: string): void {
  insert({ id: uid(), type: 'text', text, createdAt: Date.now() })
}

export function addLink(url: string): void {
  insert({ id: uid(), type: 'link', url, createdAt: Date.now() })
}

export function addFile(info: { fileName: string; fullPath?: string; fileCount?: number }): void {
  insert({
    id: uid(),
    type: 'file',
    fileName: info.fileName,
    fullPath: info.fullPath,
    fileCount: info.fileCount ?? 1,
    createdAt: Date.now()
  })
}

export function addImage(image: NativeImage): void {
  if (image.isEmpty()) return
  const png = image.toPNG()
  const size = image.getSize()
  const sig = 'i:' + size.width + 'x' + size.height + ':' + png.byteLength
  const dup = items.find((i) => i.type === 'image' && keyOf(i) === sig)
  if (dup) {
    bump(dup)
    return
  }
  ensureDir(imagesDir())
  const id = uid()
  const fileName = `${id}.png`
  writeFileSync(join(imagesDir(), fileName), png)
  const thumb = image.resize({ height: 96, quality: 'good' })
  insert({
    id,
    type: 'image',
    imagePath: fileName,
    thumbDataUrl: thumb.toDataURL(),
    width: size.width,
    height: size.height,
    sizeBytes: png.byteLength,
    createdAt: Date.now()
  })
}

/** Write a stored item back onto the system clipboard. */
export function copyBack(id: string): boolean {
  const it = byId(id)
  if (!it) return false
  switch (it.type) {
    case 'text':
      return writeClipboardText(it.text ?? '')
    case 'link':
      return writeClipboardText(it.url ?? '')
    case 'file':
      // Electron cannot restore a real CF_HDROP file drop; write the path as text.
      return writeClipboardText(it.fullPath ?? it.fileName ?? '')
    case 'image': {
      const full = imageFullPath(it)
      return Boolean(full && existsSync(full) && writeClipboardImage(nativeImage.createFromPath(full)))
    }
  }
}

export function togglePin(id: string): boolean {
  const it = byId(id)
  if (it) {
    it.pinned = !it.pinned
    persist()
    emit()
    return true
  }
  return false
}

export function remove(id: string): void {
  const it = byId(id)
  if (!it) return
  if (it.type === 'image') removeImageFile(it)
  items = items.filter((i) => i.id !== id)
  persist()
  emit()
}

export function clearAll(): void {
  for (const it of items) if (it.type === 'image') removeImageFile(it)
  items = []
  persist()
  emit()
}

/** Drop items past the retention window or over the history cap. */
export function cleanup(doEmit = true): void {
  const s = getSettings()
  const now = Date.now()
  let changed = false

  if (s.retentionDays !== 'forever') {
    const cutoff = now - Number(s.retentionDays) * 86400_000
    const keep: ClipboardItem[] = []
    for (const it of items) {
      if (it.pinned || it.createdAt >= cutoff) keep.push(it)
      else {
        if (it.type === 'image') removeImageFile(it)
        changed = true
      }
    }
    items = keep
  }

  const max = s.maxHistory > 0 ? s.maxHistory : 200
  const unpinned = items.filter((i) => !i.pinned).sort((a, b) => b.createdAt - a.createdAt)
  if (unpinned.length > max) {
    const toRemove = new Set(unpinned.slice(max).map((i) => i.id))
    for (const it of items) if (toRemove.has(it.id) && it.type === 'image') removeImageFile(it)
    items = items.filter((i) => !toRemove.has(i.id))
    changed = true
  }

  if (changed) {
    persist()
    if (doEmit) emit()
  }
}

/** Delete image files on disk that are no longer referenced by any item. */
export function sweepOrphanImages(): void {
  try {
    const dir = imagesDir()
    if (!existsSync(dir)) return
    const referenced = new Set(items.filter((i) => i.imagePath).map((i) => i.imagePath))
    for (const f of readdirSync(dir)) {
      if (!referenced.has(f)) {
        try {
          unlinkSync(join(dir, f))
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

/** Reload from disk (used after the storage path changes). */
export function reloadClipboard(): void {
  loadClipboard()
  emit()
}
