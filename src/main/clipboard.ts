import { clipboard, type NativeImage } from 'electron'

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n')
}

export function writeClipboardText(text: string): boolean {
  clipboard.writeText(text)
  return normalizeText(clipboard.readText()) === normalizeText(text)
}

export function writeClipboardImage(image: NativeImage): boolean {
  if (image.isEmpty()) return false
  clipboard.writeImage(image)
  return !clipboard.readImage().isEmpty()
}
