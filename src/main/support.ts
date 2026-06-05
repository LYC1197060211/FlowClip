import { app } from 'electron'
import { existsSync } from 'fs'
import { getBaseDir } from './paths'
import { getSettings } from './store/settingsRepo'
import { resolveBundledDocPath } from './docs'

export function buildSupportDiagnostics(): string {
  const settings = getSettings()
  const generatedAt = new Date().toISOString()
  const userGuide = resolveBundledDocPath('user-guide')
  const releaseNotes = resolveBundledDocPath('release-notes')

  return [
    'FlowClip 应用诊断信息',
    `生成时间: ${generatedAt}`,
    '',
    '版本',
    `- 应用: ${app.getVersion()}`,
    `- Electron: ${process.versions.electron ?? 'unknown'}`,
    `- Chromium: ${process.versions.chrome ?? 'unknown'}`,
    `- Node: ${process.versions.node}`,
    '',
    '系统',
    `- 平台: ${process.platform}`,
    `- 架构: ${process.arch}`,
    `- 系统版本: ${process.getSystemVersion?.() ?? 'unknown'}`,
    '',
    '数据',
    `- 数据目录: ${getBaseDir()}`,
    `- 存储位置: ${settings.storagePath ? '自定义' : '默认应用数据目录'}`,
    `- 剪贴板保留时间: ${settings.retentionDays}`,
    `- 最大记录数量: ${settings.maxHistory}`,
    `- 敏感内容保护: ${settings.sensitiveFilterEnabled ? '开启' : '关闭'}`,
    '',
    '快捷键与界面',
    `- 快捷面板: ${settings.popupHotkey}`,
    `- 语音浮窗: ${settings.voiceHotkey}`,
    `- 快捷面板自动粘贴: ${settings.autoPasteOnPopup ? '开启' : '关闭'}`,
    `- 主题: ${settings.theme}`,
    `- 窗口置顶: ${settings.alwaysOnTop ? '开启' : '关闭'}`,
    `- 开机自启: ${settings.launchOnStartup ? '开启' : '关闭'}`,
    '',
    'API 配置摘要',
    `- 翻译引擎: ${settings.translation.defaultEngine}`,
    `- 翻译 API: ${safeUrl(settings.translation.apiBaseUrl)}`,
    `- 翻译模型: ${settings.translation.model || '(未填写)'}`,
    `- 翻译代理: ${settings.translation.proxyUrl ? '已配置' : '未配置'}`,
    `- 语音 API: ${safeUrl(settings.asr.baseUrl)}`,
    `- 语音模型: ${settings.asr.model || '(未填写)'}`,
    `- 语音语言: ${settings.asr.language}`,
    `- 语音代理: ${settings.asr.proxyUrl ? '已配置' : '未配置'}`,
    `- 术语润色: ${settings.asr.polish ? '开启' : '关闭'}`,
    '',
    '随附文档',
    `- 用户手册: ${userGuide && existsSync(userGuide) ? '可用' : '缺失'}`,
    `- 发布说明: ${releaseNotes && existsSync(releaseNotes) ? '可用' : '缺失'}`,
    '',
    '说明',
    '- 本报告不包含 API Key、代理地址明文或剪贴板内容。'
  ].join('\n')
}

function safeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '(未填写)'
  try {
    const url = new URL(trimmed)
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return '(格式异常)'
  }
}
