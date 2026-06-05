import type { TranslationConfig } from '@shared/types'
import { httpFetch, HttpError } from './http'
import { chatCompletionsUrl } from './openai'

/**
 * Translate via an OpenAI-compatible chat-completions endpoint (DeepSeek by
 * default). Runs in the main process so the API key never touches the renderer.
 */
export async function translateWithAi(
  text: string,
  targetLang: string,
  cfg: TranslationConfig,
  signal: AbortSignal
): Promise<string> {
  const url = chatCompletionsUrl(cfg.apiBaseUrl)
  const res = await httpFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.model || 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `You are a professional translation engine. Translate the user's text into ${targetLang}. Output only the translation itself — no explanations, no quotes, no commentary.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.2,
      stream: false
    }),
    proxyUrl: cfg.proxyUrl,
    signal
  })
  if (!res.ok) throw new HttpError(res.status)
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const out = data?.choices?.[0]?.message?.content
  return typeof out === 'string' ? out.trim() : ''
}
