import { DEFAULT_SETTINGS } from '@shared/constants'
import type { AsrConfig, Settings, ThemeMode, TranslationConfig } from '@shared/types'
import { settingsFile } from '../paths'
import { readJson, writeJson } from './index'
import { bus, BUS } from '../bus'

let cache: Settings | null = null

/** Merge persisted values over defaults so missing/new keys are filled in. */
function normalize(raw: Partial<Settings> | null | undefined): Settings {
  const r = raw ?? {}
  return {
    ...DEFAULT_SETTINGS,
    ...r,
    translation: { ...DEFAULT_SETTINGS.translation, ...(r.translation ?? {}) },
    asr: { ...DEFAULT_SETTINGS.asr, ...(r.asr ?? {}) }
  }
}

export function loadSettings(): Settings {
  cache = normalize(readJson<Partial<Settings>>(settingsFile(), {}))
  return cache
}

export function getSettings(): Settings {
  return cache ?? loadSettings()
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = normalize({ ...getSettings(), ...patch })
  cache = next
  writeJson(settingsFile(), next)
  bus.emit(BUS.SETTINGS_CHANGED, next)
  return next
}

export function setTranslationConfig(patch: Partial<TranslationConfig>): Settings {
  const cur = getSettings()
  return saveSettings({ translation: { ...cur.translation, ...patch } })
}

export function getTranslationConfig(): TranslationConfig {
  return getSettings().translation
}

export function setAsrConfig(patch: Partial<AsrConfig>): Settings {
  const cur = getSettings()
  return saveSettings({ asr: { ...cur.asr, ...patch } })
}

export function getAsrConfig(): AsrConfig {
  return getSettings().asr
}

export function setTheme(mode: ThemeMode): Settings {
  const next = saveSettings({ theme: mode })
  bus.emit(BUS.THEME_CHANGED, mode)
  return next
}
