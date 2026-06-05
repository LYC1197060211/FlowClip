import { hasUsableProxy } from './translation/http'

const RESPONSE_PREVIEW_LIMIT = 180

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

export function proxyDetail(proxyUrl?: string): string {
  const value = proxyUrl?.trim()
  if (!value) return '代理: 未配置'
  if (hasUsableProxy(value)) return `代理: ${value}`
  return `代理未启用: ${value} 缺少端口或格式不正确`
}

export function httpStatusHint(status: number): string {
  if (status === 400) return '请求格式、模型名或参数不被服务商接受'
  if (status === 401) return 'API Key 无效、过期，或没有正确携带授权'
  if (status === 403) return '账号无权限访问该服务或模型'
  if (status === 404) return 'API 地址路径不正确，或服务商没有提供该 endpoint'
  if (status === 408) return '服务商处理超时'
  if (status === 422) return '请求参数格式不符合服务商要求'
  if (status === 429) return '额度不足、触发限流，或免费额度已用完'
  if (status >= 500) return '服务商接口暂时异常'
  return '请检查 API 地址、Key、模型名和网络代理'
}

export async function responsePreview(res: { text: () => Promise<string> }): Promise<string> {
  const text = await res.text().catch(() => '')
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  return compact.length > RESPONSE_PREVIEW_LIMIT
    ? compact.slice(0, RESPONSE_PREVIEW_LIMIT) + '...'
    : compact
}

export function modelListDetail(models: string[]): string {
  if (models.length === 0) return '模型列表: 未返回可解析模型'
  const shown = models.slice(0, 6).join(', ')
  const suffix = models.length > 6 ? ` 等 ${models.length} 个` : `共 ${models.length} 个`
  return `模型列表: ${shown} (${suffix})`
}
