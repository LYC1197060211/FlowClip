import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

/**
 * Resolves on-disk locations. Settings always live in the fixed userData dir
 * (so we can read it to discover a custom storage path). Clipboard history,
 * phrases and images live under the configurable base dir.
 */

let baseDir: string | null = null

function userData(): string {
  return app.getPath('userData')
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

/** Call once at startup (and again when the storage path changes). */
export function initPaths(storagePath: string | null): void {
  baseDir = storagePath && storagePath.trim() ? storagePath.trim() : userData()
  ensureDir(baseDir)
  ensureDir(imagesDir())
}

function base(): string {
  return baseDir ?? userData()
}

export function settingsFile(): string {
  return join(userData(), 'settings.json')
}

export function clipboardFile(): string {
  return join(base(), 'clipboard.json')
}

export function phrasesFile(): string {
  return join(base(), 'phrases.json')
}

export function imagesDir(): string {
  return join(base(), 'clipboard-images')
}

export function getBaseDir(): string {
  return base()
}
