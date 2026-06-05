import { EventEmitter } from 'events'

/**
 * Internal main-process event bus. Repositories emit on it; the app wiring
 * (index.ts) forwards these to renderer windows over IPC. Decouples the data
 * layer from window references that are created later.
 */
export const bus = new EventEmitter()

export const BUS = {
  CLIPBOARD_CHANGED: 'clipboard-changed',
  SETTINGS_CHANGED: 'settings-changed',
  THEME_CHANGED: 'theme-changed'
} as const
