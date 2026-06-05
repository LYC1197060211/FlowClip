import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'

/** Tiny dependency-free JSON persistence with atomic writes. */

export function readJson<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback
    const raw = readFileSync(file, 'utf-8')
    if (!raw.trim()) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(file: string, data: unknown): void {
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  renameSync(tmp, file)
}

export function uid(): string {
  return randomUUID()
}
