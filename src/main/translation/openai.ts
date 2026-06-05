import { trimTrailingSlash } from '../diagnostics'

export function chatCompletionsUrl(baseUrl: string): string {
  const base = trimTrailingSlash(baseUrl)
  const url = new URL(base)
  if (url.hostname === 'api.deepseek.com') return `${base}/chat/completions`
  return base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`
}
