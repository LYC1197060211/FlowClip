import { fetch as undiciFetch, ProxyAgent } from 'undici'
import type { AsrConfig, AsrResult, ConnectionTestResult } from '@shared/types'
import { getAsrConfig, getTranslationConfig } from '../store/settingsRepo'
import { httpFetch } from '../translation/http'
import {
  httpStatusHint,
  isHttpUrl,
  modelListDetail,
  proxyDetail,
  responsePreview,
  trimTrailingSlash
} from '../diagnostics'
import { chatCompletionsUrl } from '../translation/openai'

const TIMEOUT_MS = 60_000
const TEST_TIMEOUT_MS = 20_000
const PROXY_WITH_PORT = /:\d{2,5}(\/|$)/

/**
 * Transcribe WAV audio via an OpenAI-compatible /audio/transcriptions endpoint
 * (SiliconFlow SenseVoice / OpenAI Whisper / Groq / etc.). Optionally polishes
 * the result with the configured AI (DeepSeek) for punctuation + terminology.
 */
export async function transcribe(audio: Uint8Array, opts?: { polish?: boolean }): Promise<AsrResult> {
  const cfg = getAsrConfig()
  if (!cfg.baseUrl) return { ok: false, error: 'MISSING_CONFIG', message: '请在设置中配置语音识别 API 地址' }
  if (!cfg.apiKey) return { ok: false, error: 'MISSING_API_KEY', message: '请在设置中配置语音识别 API Key' }
  if (!isHttpUrl(cfg.baseUrl)) {
    return { ok: false, error: 'INVALID_API_BASE_URL', message: '语音识别 API 地址格式不正确，应以 http:// 或 https:// 开头' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const url = trimTrailingSlash(cfg.baseUrl) + '/audio/transcriptions'
    const form = new FormData()
    form.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav')
    form.append('model', cfg.model)
    if (cfg.language && cfg.language !== 'auto') form.append('language', cfg.language)
    if (cfg.hotwords.trim()) form.append('prompt', cfg.hotwords.trim())
    form.append('response_format', 'json')

    const init: Record<string, unknown> = {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
      signal: controller.signal
    }
    if (cfg.proxyUrl && PROXY_WITH_PORT.test(cfg.proxyUrl)) {
      init.dispatcher = new ProxyAgent(cfg.proxyUrl)
    }

    const res = await undiciFetch(url, init as Parameters<typeof undiciFetch>[1])
    if (!res.ok) {
      const preview = await responsePreview(res)
      return {
        ok: false,
        error: 'HTTP_' + res.status,
        message: `识别接口错误 (${res.status})：${httpStatusHint(res.status)}`,
        details: [
          `请求地址: ${url}`,
          `模型: ${cfg.model}`,
          proxyDetail(cfg.proxyUrl),
          ...(preview ? [`服务商响应: ${preview}`] : [])
        ]
      }
    }
    const data = (await res.json()) as { text?: string }
    let text = (data?.text ?? '').trim()
    if (!text) return { ok: false, error: 'EMPTY_RESULT', message: '未识别到语音内容' }

    const wantPolish = opts?.polish ?? cfg.polish
    if (wantPolish) {
      const polished = await polish(text, cfg).catch(() => null)
      if (polished) text = polished
    }
    return { ok: true, text }
  } catch (e) {
    const err = e as { name?: string; message?: string }
    if (err?.name === 'AbortError') return { ok: false, error: 'TIMEOUT', message: '识别超时,请重试' }
    return { ok: false, error: 'NETWORK', message: err?.message ? '网络错误:' + err.message : '网络错误' }
  } finally {
    clearTimeout(timer)
  }
}

export async function testAsrConfig(cfg: AsrConfig): Promise<ConnectionTestResult> {
  const details = [
    `请求地址: ${trimTrailingSlash(cfg.baseUrl || '')}/models`,
    `模型: ${cfg.model || '(未填写)'}`,
    proxyDetail(cfg.proxyUrl)
  ]
  if (!cfg.baseUrl.trim()) {
    return { ok: false, error: 'MISSING_CONFIG', message: '请填写语音识别 API 地址', details }
  }
  if (!isHttpUrl(cfg.baseUrl)) {
    return {
      ok: false,
      error: 'INVALID_API_BASE_URL',
      message: '语音识别 API 地址格式不正确，应以 http:// 或 https:// 开头',
      details
    }
  }
  if (!cfg.apiKey.trim()) {
    return { ok: false, error: 'MISSING_API_KEY', message: '请填写语音识别 API Key', details }
  }
  if (!cfg.model.trim()) {
    return { ok: false, error: 'MISSING_MODEL', message: '请填写语音识别模型名称', details }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS)
  try {
    const url = trimTrailingSlash(cfg.baseUrl) + '/models'
    details[0] = `请求地址: ${url}`
    const init: Record<string, unknown> = {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: controller.signal
    }
    if (cfg.proxyUrl && PROXY_WITH_PORT.test(cfg.proxyUrl)) {
      init.dispatcher = new ProxyAgent(cfg.proxyUrl)
    }
    const res = await undiciFetch(url, init as Parameters<typeof undiciFetch>[1])
    if (!res.ok) {
      const preview = await responsePreview(res)
      return {
        ok: false,
        error: 'HTTP_' + res.status,
        message: `语音 API 连接失败 (${res.status})：${httpStatusHint(res.status)}`,
        details: [...details, ...(preview ? [`服务商响应: ${preview}`] : [])]
      }
    }

    const data = (await res.json().catch(() => null)) as
      | { data?: Array<{ id?: string }> }
      | null
    const models = Array.isArray(data?.data)
      ? data.data.map((m) => m.id).filter((id): id is string => Boolean(id))
      : []
    details.push(modelListDetail(models))
    if (models.length > 0 && !models.includes(cfg.model)) {
      return {
        ok: false,
        error: 'MODEL_NOT_FOUND',
        message: `连接成功，但模型列表中没有 ${cfg.model}`,
        details
      }
    }
    return {
      ok: true,
      message: models.length > 0 ? `语音 API 连接成功，模型 ${cfg.model} 可用` : '语音 API 可访问，请确认模型名来自服务商文档',
      details
    }
  } catch (e) {
    const err = e as { name?: string; message?: string }
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'TIMEOUT', message: '语音 API 测试超时，请检查网络或代理', details }
    }
    return {
      ok: false,
      error: 'NETWORK',
      message: err?.message ? '网络错误: ' + err.message : '网络错误',
      details
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Refine a raw transcript: punctuation, homophone fixes, professional terminology. */
async function polish(text: string, cfg: AsrConfig): Promise<string | null> {
  const t = getTranslationConfig()
  if (!t.apiKey) return null
  const domain = cfg.domain.trim()
  const sys =
    `你是中文语音转写润色助手。请对下面的语音识别文本进行处理:` +
    `1) 正确断句并补全标点;` +
    `2) 修正明显的识别错误与同音字;` +
    `3) 使用规范、准确的专业术语${domain ? `(所属领域:${domain})` : ''};` +
    `4) 严格保持原意,不增删信息,不做解释或回答。只输出整理后的文本。`

  const url = chatCompletionsUrl(t.apiBaseUrl)
  const res = await httpFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t.apiKey}` },
    body: JSON.stringify({
      model: t.model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: text }
      ],
      temperature: 0.2,
      stream: false
    }),
    proxyUrl: t.proxyUrl
  })
  if (!res.ok) return null
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const out = data?.choices?.[0]?.message?.content
  return typeof out === 'string' ? out.trim() : null
}
