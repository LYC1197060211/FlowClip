import type { TranslationConfig } from '@shared/types'
import { httpFetch, HttpError } from './http'

/** UI language label -> Google language code. */
const LANG_CODE: Record<string, string> = {
  English: 'en',
  简体中文: 'zh-CN',
  繁體中文: 'zh-TW',
  日本語: 'ja',
  한국어: 'ko',
  Français: 'fr',
  Deutsch: 'de',
  Español: 'es',
  Русский: 'ru'
}

export async function translateWithGoogle(
  text: string,
  targetLang: string,
  cfg: TranslationConfig,
  signal: AbortSignal
): Promise<string> {
  const target = LANG_CODE[targetLang] ?? 'en'

  if (cfg.googleApiKey) {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(cfg.googleApiKey)}`
    const res = await httpFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, format: 'text' }),
      proxyUrl: cfg.proxyUrl,
      signal
    })
    if (!res.ok) throw new HttpError(res.status)
    const data = (await res.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> }
    }
    return data?.data?.translations?.[0]?.translatedText?.trim() ?? ''
  }

  // Free, unofficial endpoint — best effort, may rate-limit (matches prototype hint).
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
    target
  )}&dt=t&q=${encodeURIComponent(text)}`
  const res = await httpFetch(url, { proxyUrl: cfg.proxyUrl, signal })
  if (!res.ok) throw new HttpError(res.status)
  const data = (await res.json()) as unknown
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return (data[0] as Array<unknown>)
      .map((seg) => (Array.isArray(seg) ? (seg[0] as string) ?? '' : ''))
      .join('')
      .trim()
  }
  return ''
}
