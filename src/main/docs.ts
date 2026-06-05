import { app, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

type BundledDoc = 'user-guide' | 'release-notes'

const DOC_FILES: Record<BundledDoc, string> = {
  'user-guide': 'FlowClip_User_Guide.pdf',
  'release-notes': 'FlowClip-发布说明.md'
}

export async function openBundledDoc(doc: BundledDoc): Promise<boolean> {
  const filePath = resolveBundledDocPath(doc)
  if (!filePath) return false
  return (await shell.openPath(filePath)) === ''
}

export function resolveBundledDocPath(doc: BundledDoc): string | null {
  const fileName = DOC_FILES[doc]
  const candidates = [
    join(process.resourcesPath, 'docs', fileName),
    doc === 'user-guide'
      ? join(app.getAppPath(), 'output', 'pdf', fileName)
      : join(app.getAppPath(), 'docs', fileName),
    doc === 'user-guide'
      ? join(process.cwd(), 'output', 'pdf', fileName)
      : join(process.cwd(), 'docs', fileName)
  ]
  return candidates.find((filePath) => existsSync(filePath)) ?? null
}
