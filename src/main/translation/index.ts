import type {
  ConnectionTestResult,
  TranslateRequest,
  TranslateResult,
  TranslationConfig,
  TranslationEngine
} from '@shared/types'
import { getTranslationConfig } from '../store/settingsRepo'
import { translateWithAi } from './deepseek'
import { translateWithGoogle } from './google'
import { HttpError } from './http'
import { chatCompletionsUrl } from './openai'
import { httpStatusHint, isHttpUrl, proxyDetail } from '../diagnostics'

const TIMEOUT_MS = 20_000

export async function runTranslate(req: TranslateRequest): Promise<TranslateResult> {
  const cfg = getTranslationConfig()
  return runTranslateWithConfig(req, cfg)
}

async function runTranslateWithConfig(
  req: TranslateRequest,
  cfg: TranslationConfig
): Promise<TranslateResult> {
  const engine: TranslationEngine = req.engine ?? cfg.defaultEngine
  const text = (req.text ?? '').trim()

  if (!text) {
    return { ok: false, engine, error: 'EMPTY_INPUT', message: '请输入要翻译的内容' }
  }
  if (engine === 'ai' && !cfg.apiKey) {
    return { ok: false, engine, error: 'MISSING_API_KEY', message: '请在设置中配置 AI 翻译的 API Key' }
  }
  if (engine === 'ai' && !cfg.apiBaseUrl.trim()) {
    return { ok: false, engine, error: 'MISSING_API_BASE_URL', message: '请在设置中配置 AI 翻译 API 地址' }
  }
  if (engine === 'ai' && !isHttpUrl(cfg.apiBaseUrl)) {
    return { ok: false, engine, error: 'INVALID_API_BASE_URL', message: 'AI 翻译 API 地址格式不正确，应以 http:// 或 https:// 开头' }
  }
  if (engine === 'ai' && !cfg.model.trim()) {
    return { ok: false, engine, error: 'MISSING_MODEL', message: '请在设置中配置 AI 翻译模型名称' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const out =
      engine === 'ai'
        ? await translateWithAi(text, req.targetLang, cfg, controller.signal)
        : await translateWithGoogle(text, req.targetLang, cfg, controller.signal)
    if (!out) return { ok: false, engine, error: 'EMPTY_RESULT', message: '未获得翻译结果' }
    return { ok: true, engine, text: out }
  } catch (e) {
    const err = e as { name?: string }
    if (err?.name === 'AbortError') {
      return { ok: false, engine, error: 'TIMEOUT', message: '翻译超时,请稍后重试' }
    }
    if (e instanceof HttpError) {
      return {
        ok: false,
        engine,
        error: 'HTTP_' + e.status,
        message: `接口返回错误 (${e.status})：${httpStatusHint(e.status)}`
      }
    }
    const msg = (e as { message?: string })?.message
    return { ok: false, engine, error: 'NETWORK', message: msg ? '网络错误:' + msg : '网络错误' }
  } finally {
    clearTimeout(timer)
  }
}

export async function testTranslationConfig(
  cfg: TranslationConfig
): Promise<ConnectionTestResult> {
  const engine = cfg.defaultEngine
  const details = [
    `默认引擎: ${engine === 'ai' ? 'AI 翻译' : 'Google 翻译'}`,
    proxyDetail(cfg.proxyUrl)
  ]
  if (engine === 'ai') {
    if (!cfg.apiBaseUrl.trim()) {
      return { ok: false, error: 'MISSING_API_BASE_URL', message: '请填写 AI 翻译 API 地址', details }
    }
    if (!isHttpUrl(cfg.apiBaseUrl)) {
      return {
        ok: false,
        error: 'INVALID_API_BASE_URL',
        message: 'AI 翻译 API 地址格式不正确，应以 http:// 或 https:// 开头',
        details
      }
    }
    if (!cfg.apiKey.trim()) {
      return { ok: false, error: 'MISSING_API_KEY', message: '请填写 AI 翻译 API Key', details }
    }
    if (!cfg.model.trim()) {
      return { ok: false, error: 'MISSING_MODEL', message: '请填写 AI 翻译模型名称', details }
    }
    details.push(`请求地址: ${chatCompletionsUrl(cfg.apiBaseUrl)}`)
    details.push(`模型: ${cfg.model.trim()}`)
  } else {
    details.push(cfg.googleApiKey.trim() ? 'Google API Key: 已填写' : 'Google API Key: 未填写，使用免费接口')
  }

  const res = await runTranslateWithConfig(
    { text: 'FlowClip connection test', targetLang: 'English', engine },
    cfg
  )
  if (!res.ok) {
    return {
      ok: false,
      error: res.error,
      message: res.message ?? '翻译配置测试失败',
      details
    }
  }
  return {
    ok: true,
    message: engine === 'ai' ? 'AI 翻译连接成功' : 'Google 翻译连接成功',
    details
  }
}
