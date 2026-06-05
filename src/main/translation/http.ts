import { fetch as undiciFetch, ProxyAgent } from 'undici'

/** Only treat a proxy address with an explicit port as a real proxy. */
const PROXY_WITH_PORT = /:\d{2,5}(\/|$)/

export function hasUsableProxy(proxyUrl?: string): boolean {
  return Boolean(proxyUrl?.trim() && PROXY_WITH_PORT.test(proxyUrl.trim()))
}

export class HttpError extends Error {
  constructor(public status: number) {
    super('HTTP_' + status)
    this.name = 'HttpError'
  }
}

export interface FetchOpts {
  method?: string
  headers?: Record<string, string>
  body?: string
  proxyUrl?: string
  signal?: AbortSignal
}

/**
 * Thin wrapper over undici's fetch with optional proxy support. Uses undici's
 * own fetch (not Node's global) so a ProxyAgent dispatcher is honored reliably.
 */
export function httpFetch(url: string, opts: FetchOpts = {}) {
  const init: Record<string, unknown> = {
    method: opts.method ?? 'GET',
    headers: opts.headers,
    body: opts.body,
    signal: opts.signal
  }
  if (hasUsableProxy(opts.proxyUrl)) {
    init.dispatcher = new ProxyAgent(opts.proxyUrl!.trim())
  }
  return undiciFetch(url, init as Parameters<typeof undiciFetch>[1])
}
