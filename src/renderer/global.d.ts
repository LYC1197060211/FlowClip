import type { FlowClipApi } from '@shared/types'

declare global {
  interface Window {
    api: FlowClipApi
  }
}

export {}
